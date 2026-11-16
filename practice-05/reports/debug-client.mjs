import inspector from 'node:inspector';
import {readFile} from 'node:fs/promises';
import {createApiServer} from '../api/server.mjs';
import {createApiClient} from '../src/api-client.js';
import {createTaskApi} from '../src/task-api.js';
const session=new inspector.Session();session.connect();
const post=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(e,r)=>e?reject(e):resolve(r)));
await post('Debugger.enable');
const sourceUrl=new URL('../src/api-client.js',import.meta.url).href;
const source=(await readFile(new URL(sourceUrl),'utf8')).split('\n');
const points=[['до fetch','const response = await fetchFn'],['после Response','if (!(response instanceof Response))'],['перед JSON','try { return await response.json(); }'],['обработчик ошибки','if (cause instanceof ApiError) throw cause;']];
for(const [label,text]of points){const lineNumber=source.findIndex(line=>line.includes(text));const r=await post('Debugger.setBreakpointByUrl',{url:sourceUrl,lineNumber});console.log('Точка:',label,'строка',lineNumber+1,r.breakpointId);}
session.on('Debugger.paused',({params})=>{
 const frame=params.callFrames.find(f=>f.functionName==='requestJson')??params.callFrames[0];
 const code=`JSON.stringify((()=>{const r={};for(const [k,read]of Object.entries({url:()=>url,status:()=>response.status,ok:()=>response.ok,contentType:()=>response.headers.get('content-type'),errorKind:()=>cause.kind,errorStatus:()=>cause.status})){try{r[k]=read()}catch{}}return r})())`;
 session.post('Debugger.evaluateOnCallFrame',{callFrameId:frame.callFrameId,expression:code,returnByValue:true},(e,r)=>{console.log('Пауза:',frame.location.lineNumber+1,e?.message??r?.result?.value);session.post('Debugger.resume');});
});
const server=createApiServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{const api=createTaskApi(createApiClient({baseUrl:`http://127.0.0.1:${server.address().port}/api`}));console.log('Успешный payload:',JSON.stringify(await api.getTaskById(25)));try{await api.getTaskById(999)}catch(e){console.log('Итоговый ApiError:',JSON.stringify({kind:e.kind,status:e.status,code:e.code,details:e.details}))}}finally{await new Promise(r=>server.close(r));session.disconnect();}
