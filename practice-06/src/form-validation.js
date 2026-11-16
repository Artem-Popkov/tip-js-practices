const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

export function validateTaskDraft(draft, categories) {
  const errors = {};
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  const priority = draft?.priority;
  const rawCategory = draft?.categoryId;
  const categoryId = typeof rawCategory === "string" || typeof rawCategory === "number"
    ? Number(rawCategory) : NaN;
  if (title.length < 1 || title.length > 100) errors.title = "Название должно содержать от 1 до 100 символов.";
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите допустимый приоритет.";
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !categories.some((item) => item.id === categoryId)) {
    errors.categoryId = "Выберите существующую категорию.";
  }
  return { valid: Object.keys(errors).length === 0, value: { title, priority, categoryId }, errors };
}
