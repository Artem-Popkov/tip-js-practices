// Новый модуль ПР3. Вход: корректный массив задач и фильтр all/pending/completed.
// Результат: новый массив, исходный порядок и объекты сохраняются.
export function getVisibleTasks(tasks, filter = "all") {
  // filter() всегда возвращает НОВЫЙ массив и не меняет исходный,
  // порядок элементов сохраняется.
  if (filter === "pending") {
    return tasks.filter((task) => task.completed === false); // только «В работе»
  }
  if (filter === "completed") {
    return tasks.filter((task) => task.completed === true); // только выполненные
  }
  // "all" — копия всего массива (новый массив, но те же объекты задач).
  return [...tasks];
}
