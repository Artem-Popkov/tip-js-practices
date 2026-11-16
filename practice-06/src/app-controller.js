import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  const apiMethods = ["loadInitialData", "getTasks", "createTask", "updateTask", "setTaskCompleted", "deleteTask", "resetDemoData"];
  const viewMethods = ["setListState", "setTasks", "setCategories", "setTotal", "setFormTask", "showFormErrors", "setMutationPending", "notify"];
  if (!api || !view || apiMethods.some((name) => typeof api[name] !== "function")
    || viewMethods.some((name) => typeof view[name] !== "function") || typeof validateDraft !== "function") {
    throw new TypeError("Нужны API, представление и функция валидации.");
  }
  let tasks = [];
  let categories = [];
  let categoriesLoaded = false;
  let filters = {};
  let editingId = null;
  let activeLoad = null;
  let loadNumber = 0;
  let mutationPending = false;
  let destroyed = false;
  const mutationAbort = new AbortController();

  async function loadCurrentTasks() {
    if (destroyed) return;
    activeLoad?.abort();
    const controller = new AbortController();
    activeLoad = controller;
    const number = ++loadNumber;
    view.setListState("loading");
    try {
      const result = categoriesLoaded
        ? await api.getTasks({ ...filters }, { signal: controller.signal })
        : await api.loadInitialData({ ...filters }, { signal: controller.signal });
      // Даже если подменённый API не поддерживает отмену, старый ответ не попадёт в интерфейс.
      if (destroyed || number !== loadNumber || controller.signal.aborted) return;
      if (!categoriesLoaded) {
        categories = result.categories;
        categoriesLoaded = true;
        view.setCategories(categories);
      }
      tasks = result.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(result.meta.total);
      view.setListState(tasks.length ? "ready" : "empty");
      if (mutationPending) view.setMutationPending(true);
      return result;
    } catch (error) {
      if (destroyed || number !== loadNumber || controller.signal.aborted || error.kind === "aborted") return;
      view.setListState("error", messageForError(error));
    } finally {
      if (number === loadNumber) activeLoad = null;
    }
  }

  function cancelEdit() {
    if (destroyed) return;
    editingId = null;
    view.showFormErrors({});
    view.setFormTask(null);
  }

  async function mutate(action, message, clearEditor = false) {
    if (destroyed || mutationPending) return;
    mutationPending = true;
    // Предыдущая загрузка не должна вернуть список до изменения на сервере.
    activeLoad?.abort();
    loadNumber += 1;
    view.setMutationPending(true);
    try {
      await action({ signal: mutationAbort.signal });
      if (destroyed) return;
      if (clearEditor) cancelEdit();
      view.notify(message, "success");
      await loadCurrentTasks();
    } catch (error) {
      if (!destroyed && error.kind !== "aborted") view.notify(messageForError(error), "error");
    } finally {
      mutationPending = false;
      if (!destroyed) view.setMutationPending(false);
    }
  }

  function currentTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) view.notify("Задача отсутствует в текущем списке. Обновите список.", "error");
    return task;
  }

  return {
    start(initialFilters = {}) {
      filters = { ...initialFilters };
      cancelEdit();
      return loadCurrentTasks();
    },
    applyFilters(nextFilters = {}) {
      filters = { ...nextFilters };
      return loadCurrentTasks();
    },
    refresh: loadCurrentTasks,
    beginEdit(id) {
      if (destroyed || mutationPending) return;
      const task = currentTask(id);
      if (!task) return;
      editingId = id;
      view.showFormErrors({});
      view.setFormTask(task);
    },
    cancelEdit,
    async submit(draft) {
      if (destroyed || mutationPending) return;
      const validated = validateDraft(draft, categories);
      view.showFormErrors(validated.errors);
      if (!validated.valid) return;
      const id = editingId;
      return mutate(
        (options) => id === null ? api.createTask(validated.value, options) : api.updateTask(id, validated.value, options),
        id === null ? "Задача добавлена." : "Изменения сохранены.", true,
      );
    },
    async toggleTask(id) {
      if (destroyed || mutationPending) return;
      const task = currentTask(id);
      if (!task) return;
      return mutate((options) => api.setTaskCompleted(id, !task.completed, options), "Статус изменён.");
    },
    async deleteTask(id) {
      if (destroyed || mutationPending || !currentTask(id)) return;
      return mutate((options) => api.deleteTask(id, options), "Задача удалена.", editingId === id);
    },
    resetData() {
      return mutate((options) => api.resetDemoData(options), "Исходный набор восстановлен.", true);
    },
    destroy() {
      destroyed = true;
      loadNumber += 1;
      activeLoad?.abort();
      mutationAbort.abort();
    },
  };
}
