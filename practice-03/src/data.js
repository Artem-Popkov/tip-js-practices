// Общий контрольный набор. Для своего варианта ниже предусмотрен отдельный массив.
// Идентификатор задачи не совпадает с её индексом в массиве.
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Вариант 7: тематика "Подготовка учебного релиза".
// По таблице раздела 7: K = 6 (все шесть задач изначально выполнены),
// поэтому у всех записей ниже completed: true.
export const variantNumber = 7;
export const variantTasks = [
  { id: 11, title: "Собрать список изменений", completed: true, priority: "medium" },
  { id: 23, title: "Обновить README проекта", completed: true, priority: "low" },
  { id: 37, title: "Прогнать все проверки checks.js", completed: true, priority: "high" },
  { id: 41, title: "Зафиксировать номер версии", completed: true, priority: "medium" },
  { id: 58, title: "Проверить работу на чистой копии репозитория", completed: true, priority: "high" },
  { id: 64, title: "Опубликовать релиз на GitHub", completed: true, priority: "low" },
];
