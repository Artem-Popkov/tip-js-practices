import assert from 'node:assert/strict';
import {createApiServer} from '../api/server.mjs';
import {createApiClient} from '../src/api-client.js';
import {createTaskApi} from '../src/task-api.js';
const server=createApiServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const api=createTaskApi(createApiClient({baseUrl:`http://127.0.0.1:${server.address().port}/api`}));
try{
 const initial=await api.getTasks({q:'провер'});assert.deepEqual(initial.tasks.map(t=>t.id),[7,16]);
 console.log('Вариант 7: исходный поиск',JSON.stringify(initial));
 const created=await api.createTask({title:'Проверить учебный релиз',priority:'high',categoryId:2});
 const after=await api.getTasks({q:'провер'});assert.ok(after.tasks.some(t=>t.id===created.id));
 console.log('Вариант 7: создана задача',JSON.stringify(created));console.log('Вариант 7: итоговый поиск',JSON.stringify(after));
 const repeat=createTaskApi(createApiClient({baseUrl:`http://127.0.0.1:${server.address().port}/api`}));
 assert.equal((await repeat.getTaskById(created.id)).title,created.title);console.log('Новый клиент видит серверную задачу — OK');
 await api.resetDemoData();assert.equal((await api.getTasks()).tasks.length,12);
 const pendingBefore=await api.getTasks({completed:false});await api.setTaskCompleted(4,true);const pendingAfter=await api.getTasks({completed:false});
 assert.ok(!pendingAfter.tasks.some(t=>t.id===4));console.log('PATCH 4 → GET completed=false:',JSON.stringify({before:pendingBefore.tasks.map(t=>t.id),after:pendingAfter.tasks.map(t=>t.id)}));
 const before=await api.getTaskById(1);await api.updateTask(1,{title:'Обновить описание',priority:'low',categoryId:1});assert.equal((await api.getTaskById(1)).completed,before.completed);console.log('Редактирование выполненной задачи сохраняет completed — OK');
 await api.resetDemoData();await api.createTask({title:'До перезапуска',priority:'low',categoryId:1});assert.equal((await api.getTasks()).tasks.length,13);
 console.log('До перезапуска API: 13 задач');
}finally{await new Promise(r=>server.close(r));}
const fresh=createApiServer();await new Promise(r=>fresh.listen(0,'127.0.0.1',r));
try{const result=await createTaskApi(createApiClient({baseUrl:`http://127.0.0.1:${fresh.address().port}/api`})).getTasks();assert.equal(result.tasks.length,12);console.log('Новый процесс API: 12 исходных задач — OK');}finally{await new Promise(r=>fresh.close(r));}
