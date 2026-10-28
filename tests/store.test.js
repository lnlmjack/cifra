import test from 'node:test';
import assert from 'node:assert/strict';
import {saveCollection,loadState,exportBackup,importBackup} from '../src/store.js';
const memory=new Map();
function transaction(){
  const tx={};
  tx.objectStore=()=>({
    get(key){const request={};queueMicrotask(()=>{request.result=memory.has(key)?{value:memory.get(key)}:undefined;request.onsuccess?.()});return request;},
    put(row){memory.set(row.key,row.value);queueMicrotask(()=>tx.oncomplete?.());return tx;}
  });
  return tx;
}
globalThis.indexedDB={open(){const request={};queueMicrotask(()=>{request.result={objectStoreNames:{contains:()=>true},createObjectStore(){},transaction};request.onsuccess?.()});return request}};
test('persistência recupera coleções depois de nova leitura',async()=>{await saveCollection('songs',[{id:'s',title:'Persistente'}]);const state=await loadState();assert.equal(state.songs[0].title,'Persistente')});
test('backup exportado pode ser importado e restaurado',async()=>{const state={songs:[{id:'1',title:'Teste',text:'[C]x'}],playlists:[{id:'p',name:'Show',songIds:['1']}],favorites:['1'],history:[],settings:{theme:'light'}};const blob=await exportBackup(state);const file={text:()=>blob.text()};const restored=await importBackup(file);assert.equal(restored.playlists[0].name,'Show');assert.equal(restored.settings.theme,'light')});
