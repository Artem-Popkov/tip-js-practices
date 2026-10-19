import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

// Маленький помощник для вывода сводки в одном формате —
// чтобы не повторять одинаковые console.log() пять раз подряд.
function printStats(tasks, label) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`--- ${label} ---`);
  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
    // toFixed(1) — метод именно для ОТОБРАЖЕНИЯ (превращает число в строку
    // с одним знаком после точки); сам progress в расчётах остаётся числом.
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}

console.log("========== ОБЩИЙ СЦЕНАРИЙ (demoTasks) ==========");

// currentTasks — переменная состояния: после каждой успешной операции
// в неё кладётся НОВЫЙ массив, который вернула функция (result.tasks).
// let, а не const — потому что значение будет переприсваиваться.
let currentTasks = demoTasks;

console.log("Исходные задачи:", getTaskTitles(currentTasks));
console.log("Невыполненные:", getTaskTitles(getPendingTasks(currentTasks)));
printStats(currentTasks, "Исходное состояние");

// Шаг 2. Добавляем задачу id = 20.
const addResult = addTask(currentTasks, 20, "Добавить проверку", "high");
if (addResult.ok) {
  // Заменяем состояние ТОЛЬКО при успехе — result.tasks это новый массив.
  currentTasks = addResult.tasks;
} else {
  console.error(`Ошибка добавления: ${addResult.error}`);
}
printStats(currentTasks, "После добавления id=20");

// Шаг 3. Отмечаем id = 4 выполненной.
const completeResult = setTaskCompleted(currentTasks, 4, true);
if (completeResult.ok) {
  currentTasks = completeResult.tasks;
} else {
  console.error(`Ошибка изменения статуса: ${completeResult.error}`);
}
printStats(currentTasks, "После выполнения id=4");

// Шаг 4. Переименовываем id = 10.
const renameResult = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (renameResult.ok) {
  currentTasks = renameResult.tasks;
} else {
  console.error(`Ошибка переименования: ${renameResult.error}`);
}
printStats(currentTasks, "После переименования id=10");

// Шаг 5. Удаляем id = 7.
const removeResult = removeTask(currentTasks, 7);
if (removeResult.ok) {
  currentTasks = removeResult.tasks;
} else {
  console.error(`Ошибка удаления: ${removeResult.error}`);
}
printStats(currentTasks, "После удаления id=7");

// Шаг 6. Показываем обработанный отказ — пробуем добавить уже существующий id.
// currentTasks здесь НЕ обновляется, потому что addResult2.ok будет false.
const addResult2 = addTask(currentTasks, 20, "Дубликат", "low");
if (!addResult2.ok) {
  console.log(`Ожидаемый отказ: ${addResult2.error}`);
}

// Шаг 7. Подтверждаем, что исходный demoTasks не изменился ни разу за весь сценарий —
// все операции создавали НОВЫЕ массивы и объекты, а не мутировали старые.
console.log("Исходный demoTasks остался нетронутым:", demoTasks);
console.log("Итоговые id:", currentTasks.map((task) => task.id));


console.log("\n========== СЦЕНАРИЙ ПО ВАРИАНТУ 7 (variantTasks) ==========");

// Отдельная переменная состояния для варианта — demoTasks здесь не участвует.
let myTasks = variantTasks;

console.log(`Вариант: ${variantNumber}`);
console.log("Исходные задачи:", getTaskTitles(myTasks));
printStats(myTasks, "Исходное состояние варианта (ожидание 100.0%)");

// 2. Добавляем задачу id = 80, приоритет high (по таблице для варианта 7).
const vAdd = addTask(myTasks, 80, "Объявить о выходе релиза", "high");
if (vAdd.ok) {
  myTasks = vAdd.tasks;
} else {
  console.error(`Ошибка: ${vAdd.error}`);
}
printStats(myTasks, "После добавления id=80");

// 3. Устанавливаем completed = true для id = 11 (задача уже была выполнена —
// по условию методички операция всё равно должна пройти успешно).
const vComplete = setTaskCompleted(myTasks, 11, true);
if (vComplete.ok) {
  myTasks = vComplete.tasks;
} else {
  console.error(`Ошибка: ${vComplete.error}`);
}
printStats(myTasks, "После повторного выполнения id=11");

// 4. Переименовываем id = 23.
const vRename = renameTask(myTasks, 23, "Обновить README и CHANGELOG");
if (vRename.ok) {
  myTasks = vRename.tasks;
} else {
  console.error(`Ошибка: ${vRename.error}`);
}
printStats(myTasks, "После переименования id=23");

// 5. Удаляем id = 37.
const vRemove = removeTask(myTasks, 37);
if (vRemove.ok) {
  myTasks = vRemove.tasks;
} else {
  console.error(`Ошибка: ${vRemove.error}`);
}
printStats(myTasks, "После удаления id=37");

// 6. Пробуем повторно добавить id = 80 — должен быть отказ, состояние не меняется.
const vAddAgain = addTask(myTasks, 80, "Повтор", "low");
if (!vAddAgain.ok) {
  console.log(`Ожидаемый отказ повторного добавления: ${vAddAgain.error}`);
}

// 7. Итог по варианту + подтверждение, что variantTasks (исходный) не пострадал.
console.log("Итоговые id варианта:", myTasks.map((task) => task.id));
console.log("Исходный variantTasks остался нетронутым:", variantTasks.map((t) => t.id));
