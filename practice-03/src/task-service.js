// Заготовка модуля. throw ниже отмечает отсутствие реализации,
// а не способ обработки некорректных данных в готовом решении.
// Для предусмотренных ошибок необходимо возвращать { ok: false, error: "..." }.
// console.log(), prompt(), document и чтение внешнего состояния здесь не нужны.

// Список допустимых значений приоритета — вынесен в константу,
// чтобы не повторять один и тот же массив в нескольких функциях.
const ALLOWED_PRIORITIES = ["low", "medium", "high"];

// Маленькая внутренняя функция проверки id — используется во всех операциях
// (createTask, setTaskCompleted, renameTask, removeTask), чтобы не дублировать
// одну и ту же логику 4 раза. Не экспортируется — видна только внутри этого файла.
function validateId(id) {
  // typeof id !== "number" отсекает строки типа "4", булевы значения и т.д.
  // Number.isSafeInteger(id) отсекает дробные числа (1.5), NaN, Infinity —
  // это единственная функция, которая одновременно проверяет "число" и "целое".
  // id <= 0 отсекает 0 и отрицательные числа (id должен быть положительным).
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    // Возвращаем текстовое сообщение об ошибке (или null, если всё ок) —
    // вызывающая функция сама решит, как обернуть его в { ok: false, error }.
    return "id должен быть положительным целым числом";
  }
  return null; // null означает "ошибок нет"
}

// Аналогичная внутренняя проверка для title — переиспользуется в createTask и renameTask.
function validateTitle(title) {
  if (typeof title !== "string") {
    return { error: "title должен быть строкой" };
  }
  // trim() убирает пробелы по краям — считаем длину уже "очищенной" строки.
  const trimmed = title.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { error: "длина title должна быть от 1 до 100 символов" };
  }
  // При успехе возвращаем не только "ошибок нет", но и саму очищенную строку,
  // чтобы не делать trim() повторно в вызывающем коде.
  return { error: null, trimmed };
}

export function createTask(id, title, priority = "medium") {
  // Шаг 1: проверяем id через вынесенную функцию.
  const idError = validateId(id);
  if (idError !== null) {
    // Если ошибка есть — сразу возвращаем результат отказа и выходим из функции.
    return { ok: false, error: idError };
  }

  // Шаг 2: проверяем title тем же способом.
  const titleCheck = validateTitle(title);
  if (titleCheck.error !== null) {
    return { ok: false, error: titleCheck.error };
  }

  // Шаг 3: проверяем priority — должен быть строго одним из трёх значений.
  // includes() возвращает true/false: "входит ли priority в этот список".
  if (!ALLOWED_PRIORITIES.includes(priority)) {
    return { ok: false, error: "priority должен быть low, medium или high" };
  }

  // Шаг 4: все проверки пройдены — собираем итоговый объект задачи.
  return {
    ok: true,
    task: {
      id, // сокращённая запись { id } эквивалентна { id: id }
      title: titleCheck.trimmed, // записываем именно очищенную от пробелов строку
      completed: false, // при создании задача всегда невыполненная
      priority, // сокращённая запись, значение уже проверено на шаге 3
    },
  };
}

export function findTaskById(tasks, id) {
  // find() проходит по массиву и возвращает ПЕРВЫЙ элемент, для которого
  // функция-условие вернула true. Если подходящего элемента нет — вернёт undefined.
  // === (строгое равенство) не путает число 4 со строкой "4".
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  // filter() проходит по массиву и возвращает НОВЫЙ массив из всех элементов,
  // для которых условие истинно. Порядок сохраняется, исходный массив не трогается.
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  // map() проходит по массиву и возвращает НОВЫЙ массив той же длины,
  // где каждый элемент — результат применения функции к соответствующей задаче.
  // Здесь из каждого объекта задачи достаём только поле title.
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length; // общее количество задач в переданном массиве

  // Считаем количество выполненных задач через filter().length —
  // filter даёт новый массив только из completed === true, а .length — его размер.
  const completed = tasks.filter((task) => task.completed === true).length;

  const pending = total - completed; // осталось — просто разница

  // Особый случай: если задач нет вообще, прогресс явно задаём как 0,
  // иначе получилось бы деление 0/0, которое даёт NaN (не число).
  const progress = total === 0 ? 0 : (completed / total) * 100;

  // Возвращаем объект сразу с четырьмя полями (сокращённая запись { total } и т.д.).
  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  // Шаг 1: переиспользуем createTask — она уже делает все нужные проверки
  // id/title/priority. Не дублируем эту логику второй раз.
  const created = createTask(id, title, priority);
  if (!created.ok) {
    // Если createTask вернула ошибку — сразу пробрасываем её наружу как есть.
    return created; // это уже объект { ok: false, error: "..." }
  }

  // Шаг 2: проверяем, что такого id ещё нет в списке (иначе будет дубликат).
  const duplicate = tasks.find((task) => task.id === id);
  if (duplicate !== undefined) {
    return { ok: false, error: `Задача с id ${id} уже существует` };
  }

  // Шаг 3: возвращаем НОВЫЙ массив — исходный tasks не изменяем.
  // Spread [...tasks] копирует все элементы старого массива в новый,
  // а created.task добавляется последним элементом (в конец списка).
  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  // Проверяем id по общим правилам.
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }

  // completed должен быть строго true или false — "false" (строка) или 0 не подходят.
  if (typeof completed !== "boolean") {
    return { ok: false, error: "completed должен быть true или false" };
  }

  // Ищем задачу — если её нет, findTaskById вернёт undefined.
  const target = findTaskById(tasks, id);
  if (target === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  // map() проходит по всем задачам и строит новый массив.
  // Для найденной задачи создаём НОВЫЙ объект через spread {...task, completed} —
  // это копирует все старые поля (title, priority, id) и перезаписывает только completed.
  // Для всех остальных задач возвращаем их же без изменений (task) —
  // они не редактировались, поэтому пересоздавать их не нужно.
  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, completed } : task
  );

  return { ok: true, tasks: updatedTasks };
}

export function renameTask(tasks, id, title) {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }

  // Переиспользуем ту же проверку названия, что и в createTask.
  const titleCheck = validateTitle(title);
  if (titleCheck.error !== null) {
    return { ok: false, error: titleCheck.error };
  }

  const target = findTaskById(tasks, id);
  if (target === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  // Та же схема: map() + spread, только меняем поле title (на очищенную строку),
  // остальные поля (completed, priority) сохраняются автоматически через {...task}.
  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, title: titleCheck.trimmed } : task
  );

  return { ok: true, tasks: updatedTasks };
}

export function removeTask(tasks, id) {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }

  const target = findTaskById(tasks, id);
  if (target === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  // filter() строит новый массив из всех задач, КРОМЕ той, чей id совпал —
  // условие task.id !== id означает "оставить в новом массиве всё, что не равно id".
  const updatedTasks = tasks.filter((task) => task.id !== id);

  return { ok: true, tasks: updatedTasks };
}
