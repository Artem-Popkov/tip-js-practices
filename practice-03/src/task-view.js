import { getTaskStats } from "./task-service.js";

// Здесь создаётся DOM, но не изменяется состояние приложения.

// Словарь: код приоритета из модели → подпись на странице.
const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

// Вспомогательная функция: создаёт кнопку действия с вложенной подписью span.
function createActionButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action; // в HTML станет data-action="toggle" / "delete"

  const span = document.createElement("span");
  span.className = "action-label";
  span.textContent = label;

  button.append(span);
  return button;
}

export function createTaskElement(task) {
  // Корневой элемент карточки.
  const item = document.createElement("li");
  item.className = "task-card";
  item.dataset.taskId = String(task.id); // data-task-id — по нему обработчик узнаёт задачу
  if (task.completed) {
    item.classList.add("is-completed");
  }

  // Название. ВАЖНО: textContent, а не innerHTML — текст «<strong>» останется текстом,
  // браузер не превратит его в HTML-тег (защита от XSS).
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const status = document.createElement("p");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("p");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority];

  // Кнопки. aria-pressed сообщает экранному диктору, «нажат» ли переключатель.
  const toggleButton = createActionButton("toggle", "Выполнена");
  toggleButton.setAttribute("aria-pressed", String(task.completed));
  const deleteButton = createActionButton("delete", "Удалить");

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(toggleButton, deleteButton);

  item.append(title, status, priority, actions);
  return item; // обработчики здесь НЕ назначаются — их ставит main.js на весь список
}

export function renderTaskList(listElement, tasks) {
  // map() делает массив новых карточек, replaceChildren() заменяет ВСЕ старые дети
  // списка на новые. Поэтому повторный вызов не накапливает карточки,
  // а сам <ul> (и обработчик на нём) остаётся на месте.
  const cards = tasks.map((task) => createTaskElement(task));
  listElement.replaceChildren(...cards);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  // Статистику считает функция из ПР2 по ВСЕМУ массиву, а не по карточкам на экране.
  const stats = getTaskStats(tasks);

  const setStat = (name, value) => {
    summaryElement.querySelector(`[data-stat="${name}"]`).textContent = String(value);
  };

  setStat("total", stats.total);
  setStat("completed", stats.completed);
  setStat("pending", stats.pending);
  setStat("progress", `${stats.progress.toFixed(1)}%`); // toFixed(1) → один знак: 66.7%
  setStat("visible", visibleCount); // а вот это — сколько показано после фильтра
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (visibleCount > 0) {
    // Есть что показать — сообщение очищаем и прячем.
    messageElement.textContent = "";
    messageElement.hidden = true;
    return;
  }
  // Карточек нет: различаем «задач вообще нет» и «фильтр ничего не нашёл».
  messageElement.textContent =
    total === 0 ? "Список задач пуст." : "Нет задач по выбранному фильтру.";
  messageElement.hidden = false;
}
