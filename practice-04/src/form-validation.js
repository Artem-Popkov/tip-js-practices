const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Чистая функция: не обращается к странице и не изменяет исходные данные.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  const rawId = draft?.id;
  // FormData возвращает строки; в режиме редактирования используем editingId.
  const id = editingId === null
    ? (typeof rawId === "string" || typeof rawId === "number" ? Number(rawId) : NaN)
    : editingId;
  if (!Number.isSafeInteger(id) || id <= 0) {
    errors.id = "Введите положительное целое число в допустимом диапазоне.";
  } else if (editingId === null && tasks.some((task) => task.id === id)) {
    errors.id = `Задача с id ${id} уже существует.`;
  } else if (editingId !== null && !tasks.some((task) => task.id === id)) {
    errors.id = `Задача с id ${id} не найдена.`;
  }
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  if (title.length < 1 || title.length > 100) {
    errors.title = "Введите название от 1 до 100 символов после удаления краевых пробелов.";
  }
  const priority = draft?.priority;
  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Выберите низкий, средний или высокий приоритет.";
  }
  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { id, title, priority } };
}
