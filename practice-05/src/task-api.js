import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
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

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
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
  return { getTasks, getTaskById, getCategories, loadInitialData };
}
