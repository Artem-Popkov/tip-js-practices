import assert from 'node:assert/strict';
import {createApiServer} from '../api/server.mjs';
import {createApiClient, buildUrl} from '../src/api-client.js';
import {createTaskApi} from '../src/task-api.js';
const server=createApiServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const baseUrl=`http://127.0.0.1:${server.address().port}/api`;
const client=createApiClient({baseUrl});
const api=createTaskApi(client);
try {
 console.log('Предварительный прогноз очередей: A B C D E F');
 await import('../examples/event-loop.js');
 await new Promise(resolve=>setTimeout(resolve,10));
 const all=await api.getTasks();
 const filtered=await api.getTasks({completed:false,priority:'high'});
 const variant=await api.loadInitialData({q:'провер'});
 console.log('Общий список:', JSON.stringify(all));
 console.log('Общий фильтр:', JSON.stringify(filtered));
 console.log('Вариант 7:',JSON.stringify(variant));
 console.log('Задача 25:', JSON.stringify(await api.getTaskById(25)));
 for (const path of ['/health','/tasks/25','/tasks/999']) {
  const response=await fetch(baseUrl+path);
  console.log('HTTP:',JSON.stringify({url:baseUrl+path,status:response.status,ok:response.ok,contentType:response.headers.get('content-type'),payload:await response.json()}));
 }
 for(const [path,query] of [['/tasks/999',{}],['/tasks',{completed:'yes'}],['/debug/error',{}],['/debug/invalid-json',{}],['/debug/text',{}]]) {
  try {await client.requestJson(path,{query}); assert.fail('Ожидалась ошибка');}
  catch(e) {console.log('Ошибка:',JSON.stringify({path,kind:e.kind,status:e.status,code:e.code,details:e.details}));assert.ok(e.kind);}
 }
 const sequential=[],parallel=[];
 for(let i=0;i<3;i++) {
  let t=performance.now();await client.requestJson('/debug/delay',{query:{ms:120}});await client.requestJson('/debug/delay',{query:{ms:120}});sequential.push(+(performance.now()-t).toFixed(1));
  t=performance.now();await Promise.all([client.requestJson('/debug/delay',{query:{ms:120}}),client.requestJson('/debug/delay',{query:{ms:120}})]);parallel.push(+(performance.now()-t).toFixed(1));
 }
 console.log('Измерения, мс:',JSON.stringify({sequential,parallel,delay:120}));
 const encoded=new URL(buildUrl(baseUrl,'/tasks',{q:'API & ошибки + JSON'}));
 assert.equal(encoded.searchParams.get('q'),'API & ошибки + JSON');
 console.log('Собственная проверка 1: кодирование &, + и кириллицы — OK;',encoded.href);
 await assert.rejects(()=>api.getTaskById(999),e=>e.kind==='http'&&e.status===404);
 console.log('Собственная проверка 2: 404 сохраняет kind/status — OK');
 await assert.rejects(()=>client.requestJson('/debug/delay',{query:{ms:120},timeoutMs:10}),e=>e.kind==='timeout');
 console.log('Собственная проверка 3: задержка 120 мс, timeout 10 мс — OK');
 const controller=new AbortController();const pending=client.requestJson('/debug/delay',{query:{ms:120},signal:controller.signal});controller.abort();
 await assert.rejects(()=>pending,e=>e.kind==='aborted');
 console.log('Явная отмена: aborted — OK');
 const address=baseUrl;
 await new Promise(resolve=>server.close(resolve));
 await assert.rejects(()=>client.requestJson('/tasks'),e=>e.kind==='network');
 console.log('После остановки API: network — OK');
 await new Promise(resolve=>server.listen(Number(new URL(address).port),'127.0.0.1',resolve));
 assert.equal((await api.getTasks()).tasks.length,12);
 console.log('После повторного запуска: 12 задач — OK');
} finally {await new Promise(resolve=>server.close(resolve));}
