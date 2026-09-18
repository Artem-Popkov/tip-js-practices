"use strict";

const totalTasks = 10;
const completedTasks = 7;
const dailyLimit = 3;

if (typeof totalTasks !== "number" || typeof completedTasks !== "number") {
  console.log("Ошибка: значения должны быть числами.");
} else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: значения должны быть целыми числами.");
} else if (totalTasks < 0 || totalTasks > 1000) {
  console.log("Ошибка: количество задач вне диапазона 0…1000.");
} else if (completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше, чем существует.");
} else if (typeof dailyLimit !== "number" || !Number.isInteger(dailyLimit)) {
  console.log("Ошибка: дневная норма должна быть целым числом.");
} else if (dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневная норма вне диапазона 1…1000.");
} else {
  let remaining = totalTasks - completedTasks;

  if (remaining === 0) {
    console.log("Все задачи выполнены.");
    console.log("Потребуется дней: 0");
  } else {
    console.log(`Осталось задач: ${remaining}`);

    let day = 0;
    while (remaining > 0) {
      day += 1;
      const doneToday = Math.min(dailyLimit, remaining);
      remaining -= doneToday;
      console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`);
    }

    console.log(`Потребуется дней: ${day}`);
  }
}