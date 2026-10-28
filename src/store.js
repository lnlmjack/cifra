const DB_NAME='cifra-studio-db';
const STORE='records';
const DEFAULTS={songs:[],playlists:[],favorites:[],history:[],settings:{theme:'dark',scrollSpeed:18,preferFlats:false,fontSize:19,lineHeight:1.7}};
let dbPromise;
function openDB(){
  if(!globalThis.indexedDB) return Promise.reject(new Error('Este navegador não oferece IndexedDB.'));
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'});};
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Falha ao abrir o banco local.'));
  });
  return dbPromise;
}
async function get(key){try{const db=await openDB();return await new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result?.value);r.onerror=()=>reject(r.error);});}catch(error){if(error.message.includes('IndexedDB'))return undefined;throw error}}
async function put(key,value){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({key,value});tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error||new Error('Não foi possível salvar no dispositivo.'));tx.onabort=()=>reject(tx.error||new Error('O salvamento foi cancelado.'));});}
export async function loadState(){
  const state={};
  for(const key of Object.keys(DEFAULTS)) { const value=await get(key); state[key]=value===undefined?structuredClone(DEFAULTS[key]):value; }
  return state;
}
export async function saveState(state){for(const key of Object.keys(DEFAULTS)) await put(key,state[key]??DEFAULTS[key]);return state;}
export async function saveCollection(key,value){if(!(key in DEFAULTS))throw new Error('Coleção desconhecida.');return put(key,value);}
export async function exportBackup(state){return new Blob([JSON.stringify({format:'cifra-studio-v1',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});}
export async function importBackup(file){
  const parsed=JSON.parse(await file.text());
  if(!parsed||parsed.format!=='cifra-studio-v1'||!Array.isArray(parsed.songs)||!Array.isArray(parsed.playlists))throw new Error('Arquivo de backup inválido ou incompatível.');
  const state={...structuredClone(DEFAULTS),...parsed}; delete state.format; delete state.exportedAt;
  state.favorites=Array.isArray(state.favorites)?state.favorites:[];state.history=Array.isArray(state.history)?state.history:[];
  state.settings={...DEFAULTS.settings,...(state.settings||{})};
  await saveState(state); return state;
}
