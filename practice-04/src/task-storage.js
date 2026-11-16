export const STORAGE_VERSION = 1;
const PRIORITIES = new Set(["low", "medium", "high"]);
const copyTasks = (tasks) => tasks.map((task) => ({ ...task }));

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();
  for (const task of value) {
    if (!task || typeof task !== "object" || Array.isArray(task)
      || !Number.isSafeInteger(task.id) || task.id <= 0 || ids.has(task.id)
      || typeof task.title !== "string" || task.title !== task.title.trim()
      || task.title.length < 1 || task.title.length > 100
      || typeof task.completed !== "boolean" || !PRIORITIES.has(task.priority)) {
      return false;
    }
    ids.add(task.id);
  }
  return true;
}

export function loadTasks(storage, key, fallbackTasks) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { ok: true, source: "initial", tasks: copyTasks(fallbackTasks) };
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== STORAGE_VERSION || !isValidTaskList(saved.tasks)) {
      throw new Error("Неверная версия или структура сохранённых задач");
    }
    return { ok: true, source: "storage", tasks: copyTasks(saved.tasks) };
  } catch (error) {
    // Повреждённую запись не удаляем и не перезаписываем при загрузке.
    return {
      ok: false, source: "fallback", tasks: copyTasks(fallbackTasks),
      error: `Не удалось восстановить задачи; используется исходный набор. ${error.message}`,
    };
  }
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) return { ok: false, error: "Некорректные задачи не сохранены." };
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить задачи: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сбросить сохранённые данные: ${error.message}` };
  }
}
