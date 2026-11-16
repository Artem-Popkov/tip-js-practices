const PRIORITY_LABELS = { low: "Низкий", medium: "Средний", high: "Высокий" };

export function createTaskElement(task, category) {
  const item = document.createElement("li");
  item.className = "task-card";
  item.classList.toggle("is-completed", task.completed);
  item.dataset.taskId = String(task.id);
  for (const [tag, className, text] of [
    ["h3", "task-title", task.title],
    ["p", "task-status", task.completed ? "Выполнена" : "В работе"],
    ["p", "task-priority", PRIORITY_LABELS[task.priority]],
    ["p", "task-category", category?.name ?? "Неизвестная категория"],
  ]) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    item.append(node);
  }
  const actions = document.createElement("div");
  actions.className = "task-actions";
  for (const [action, label] of [["toggle", "Выполнена"], ["edit", "Изменить"], ["delete", "Удалить"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    const span = document.createElement("span");
    span.className = "action-label";
    span.textContent = label;
    button.append(span);
    if (action === "toggle") button.setAttribute("aria-pressed", String(task.completed));
    actions.append(button);
  }
  item.append(actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}
