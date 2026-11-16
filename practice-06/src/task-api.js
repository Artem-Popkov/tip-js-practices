import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных — { signal }.
export function createTaskApi(client) {

  if (!client || typeof client.requestJson !== "function") throw new TypeError("Нужен клиент с requestJson.");
  function normalizeFilters(filters) {
    if (!filters || Object.getPrototypeOf(filters) !== Object.prototype) throw new TypeError("Нужен объект фильтров.");
    const query = {};
    for (const [key, value] of Object.entries(filters)) {
      if (!ALLOWED_FILTERS.has(key)) throw new TypeError(`Неизвестный фильтр ${key}.`);
      if (key === "completed" && typeof value !== "boolean") throw new TypeError("completed должен быть boolean.");
      if (key === "priority" && !ALLOWED_PRIORITIES.has(value)) throw new TypeError("Недопустимый приоритет.");
      if (key === "categoryId" && !isPositiveSafeInteger(value)) throw new TypeError("Недопустимая категория.");
      if (key === "q") {
        if (typeof value !== "string" || value.trim().length > 100) throw new TypeError("Поисковая строка до 100 символов.");
        if (value.trim()) query[key] = value.trim();
      } else query[key] = value;
    }
    return query;
  }
  function validCollection(payload, validator) {
    return Boolean(payload && Array.isArray(payload.data) && payload.data.every(validator)
      && new Set(payload.data.map((item) => item.id)).size === payload.data.length
      && payload.meta?.total === payload.data.length);
  }
  function requireId(id) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("Нужен положительный целый id.");
  }
  async function getTasks(filters = {}, options) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query, ...options });
    if (!validCollection(payload, isTask) || !payload.meta.filters
      || Object.getPrototypeOf(payload.meta.filters) !== Object.prototype) {
      throw invalidResponse("Неверная схема списка задач.");
    }
    return { tasks: payload.data, meta: payload.meta };
  }
  async function getTaskById(id, options) {
    requireId(id);
    const payload = await client.requestJson(`/tasks/${id}`, options);
    if (!isTask(payload?.data) || payload.data.id !== id) throw invalidResponse("Неверная схема задачи.");
    return payload.data;
  }
  async function getCategories(options) {
    const payload = await client.requestJson("/categories", options);
    if (!validCollection(payload, isCategory)) throw invalidResponse("Неверная схема категорий.");
    return payload.data;
  }
  async function loadInitialData(filters = {}, options) {
    const [result, categories] = await Promise.all([getTasks(filters, options), getCategories(options)]);
    if (!result.tasks.every((task) => categories.some((category) => category.id === task.categoryId))) {
      throw invalidResponse("Задача ссылается на неизвестную категорию.");
    }
    return { ...result, categories };
  }

  async function requestTask(path, method, body, options) {
    const payload = await client.requestJson(path, { ...options, method, body });
    if (!isTask(payload?.data)) throw invalidResponse("Неверная схема изменённой задачи.");
    return payload.data;
  }
  async function createTask(draft, options) {
    return requestTask("/tasks", "POST", draft, options);
  }
  async function updateTask(id, changes, options) {
    requireId(id);
    const task = await requestTask(`/tasks/${id}`, "PATCH", changes, options);
    if (task.id !== id) throw invalidResponse("Сервер изменил id задачи.");
    return task;
  }
  async function setTaskCompleted(id, completed, options) {
    if (typeof completed !== "boolean") throw new TypeError("Статус должен быть boolean.");
    return updateTask(id, { completed }, options);
  }
  async function deleteTask(id, options) {
    requireId(id);
    const result = await client.requestJson(`/tasks/${id}`, { ...options, method: "DELETE" });
    if (result !== null) throw invalidResponse("После удаления ожидался ответ без тела.");
    return null;
  }
  async function resetDemoData(options) {
    const payload = await client.requestJson("/debug/reset", { ...options, method: "POST" });
    if (payload?.data?.reset !== true || !Number.isSafeInteger(payload.data.total) || payload.data.total < 0) {
      throw invalidResponse("Сервер не подтвердил сброс.");
    }
    return payload.data;
  }
  return { getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask, setTaskCompleted, deleteTask, resetDemoData };
}
