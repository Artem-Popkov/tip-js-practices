import {validateTaskDraft} from '../src/form-validation.js';
const tasks=[];
for (const title of ['  Изучить localStorage  ','   ']) {
 const draft={id:'20',title,priority:'high'};
 console.log('Вызов:',JSON.stringify(draft));
 console.log('Результат:',JSON.stringify(validateTaskDraft(draft,tasks),null,2));
}
