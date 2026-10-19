// КР1, задания 2–3: проверочные вызовы функций ПР2.
// Запуск из папки practice-02:  node kr1.js
import { demoTasks } from "./src/data.js";
import { getPendingTasks, setTaskCompleted } from "./src/task-service.js";

console.log("=== Задание 2. getPendingTasks ===");
console.log("demoTasks → id:", getPendingTasks(demoTasks).map((t) => t.id)); // ожидаем [4, 7]
console.log("[] →", getPendingTasks([])); // ожидаем []

console.log("\n=== Задание 3. setTaskCompleted ===");
const result = setTaskCompleted(demoTasks, 4, true);
console.log("ok:", result.ok);
console.log("Новая запись id 4, completed:", result.tasks.find((t) => t.id === 4).completed); // true
console.log("Исходная запись id 4, completed:", demoTasks.find((t) => t.id === 4).completed); // false

const fail = setTaskCompleted(demoTasks, 777, true);
console.log("id 777 →", fail); // { ok: false, error: ... }
console.log("Исходные данные не изменились:", demoTasks.map((t) => `${t.id}:${t.completed}`).join(", "));
