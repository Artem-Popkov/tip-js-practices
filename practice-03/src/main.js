import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
};

// Готовая служебная часть: ?dataset=variant включает данные своего варианта.
// Наборы не смешиваются, редактировать код для переключения не требуется.
const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
const initialTasks = isVariant ? variantTasks : demoTasks;
let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

const VALID_FILTERS = ["all", "pending", "completed"];
const VALID_ACTIONS = ["toggle", "delete"];

function renderApp() {
  // 1. Считаем, какие задачи видны при текущем фильтре (currentTasks не меняется).
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);

  // 2. Обновляем все части страницы согласованно.
  renderTaskList(elements.list, visibleTasks);
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);

  // 3. Подсвечиваем активный фильтр: класс is-active и aria-pressed.
  for (const button of elements.filters.querySelectorAll("button[data-filter]")) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function handleTaskListClick(event) {
  // 1. Цель клика может быть span внутри кнопки — closest() поднимается вверх
  //    по дереву и находит ближайшую кнопку с data-action. Это и есть делегирование:
  //    один обработчик на весь <ul> вместо обработчика на каждой кнопке.
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-action]");
  if (!button || !elements.list.contains(button)) return; // клик мимо кнопок

  const action = button.dataset.action;
  if (!VALID_ACTIONS.includes(action)) return; // неизвестное действие игнорируем

  // 2. Находим карточку и читаем id. dataset всегда даёт СТРОКУ, поэтому Number().
  const card = button.closest("li[data-task-id]");
  if (!card) return;
  const rawId = card.dataset.taskId; // например "4" (string)
  const id = Number(rawId); // 4 (number); "4abc" → NaN
  if (!Number.isSafeInteger(id) || id <= 0) {
    elements.message.textContent = `Некорректный идентификатор задачи: «${rawId}».`;
    return; // данные не трогаем
  }

  // 3. Вызываем функцию ПР2 — она и есть источник правды об изменениях.
  let result;
  if (action === "toggle") {
    const task = findTaskById(currentTasks, id);
    if (!task) {
      elements.message.textContent = `Задача с id ${id} не найдена.`;
      return;
    }
    result = setTaskCompleted(currentTasks, id, !task.completed); // противоположный статус
  } else {
    result = removeTask(currentTasks, id);
  }

  // 4. Разбираем результат { ok, tasks } / { ok: false, error }.
  if (!result.ok) {
    elements.message.textContent = result.error; // массив НЕ меняем
    return;
  }
  currentTasks = result.tasks; // сохраняем новый массив
  elements.message.textContent = "";
  renderApp();
  restoreTaskFocus(id, action); // возвращаем фокус клавиатуры на нужную кнопку
}

function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-filter]");
  if (!button || !elements.filters.contains(button)) return;

  const filter = button.dataset.filter;
  if (!VALID_FILTERS.includes(filter)) return; // неизвестный фильтр игнорируем

  currentFilter = filter; // меняется только фильтр, сами задачи — нет
  elements.message.textContent = "";
  renderApp();
}

// Готовая вспомогательная функция. Сохраняет понятную позицию клавиатурного фокуса
// после замены карточек. Если карточки больше нет, фокус получает активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

// Подписки выполняются один раз. Эти контейнеры не заменяются при перерисовке.
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);

// До реализации renderApp ожидается сообщение о заглушке.
// try/catch здесь — готовая диагностика старта, а не замена проверки result.ok.
try {
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}
