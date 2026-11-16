import {createApiClient} from '../src/api-client.js';
import {createTaskApi} from '../src/task-api.js';
const client=createApiClient({baseUrl:'http://127.0.0.1:5505/api'});
const api=createTaskApi(client);
console.log('КР2 — получение задач с сервера');
const {tasks,meta}=await api.getTasks({completed:false,priority:'high'});
console.log('GET /api/tasks?completed=false&priority=high');
console.log('id:',tasks.map(task=>task.id));
console.log('meta.total:',meta.total);
console.log('\nКР2 — обработка HTTP-ошибки');
try {await api.getTaskById(999);} catch(error) {
 console.log('GET /api/tasks/999');
 console.log('kind:',error.kind);
 console.log('status:',error.status);
}
