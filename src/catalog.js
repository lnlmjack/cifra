const REPOSITORY='lnlmjack/cifra';
const BRANCH='main';
const TREE_URL=`https://api.github.com/repos/${REPOSITORY}/git/trees/${BRANCH}?recursive=1`;
const RAW_BASE=`https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/`;

export function buildCatalog(tree){
  if(!tree||!Array.isArray(tree.tree))throw new Error('O GitHub não retornou a lista de arquivos esperada.');
  if(tree.truncated)throw new Error('O GitHub limitou a lista de arquivos do acervo. O catálogo precisa ser dividido em índices menores.');
  return tree.tree.filter(item=>item.type==='blob'&&/^cifras\/.+\.txt$/i.test(item.path)&&!item.path.split('/').at(-1).startsWith('._')&&!item.path.split('/').at(-1).toLowerCase().includes('.ds_store')).map(item=>{
    const parts=item.path.split('/');
    const file=parts.at(-1).replace(/\.txt$/i,'');
    const artist=parts.length>3?parts.slice(2,-1).join(' / '):'';
    const title=file.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
    return {path:item.path,title,artist,version:/\b(simplificada|acustica|acústica|vers[aã]o\s*\d+|solo|intro)\b/i.test(file)?'outra versão':'normal'};
  });
}

const normalize=value=>String(value||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ');
export function searchCatalog(query,catalog,limit=35){
  const q=normalize(query);if(q.length<2)return [];
  const terms=q.split(' ');
  return catalog.map(item=>{const haystack=normalize(`${item.title} ${item.artist}`);const score=haystack.includes(q)?3:terms.every(term=>haystack.includes(term))?1:0;return {item,score}}).filter(row=>row.score).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'pt-BR')).slice(0,limit).map(row=>row.item);
}

export async function loadCatalog(fetcher=fetch){
  const response=await fetcher(TREE_URL,{headers:{Accept:'application/vnd.github+json'}});
  if(!response.ok)throw new Error(response.status===403?'O limite temporário de consultas do GitHub foi atingido. Tente novamente mais tarde.':`Não foi possível acessar o catálogo do GitHub (erro ${response.status}).`);
  return buildCatalog(await response.json());
}

export async function loadCatalogSong(item,fetcher=fetch){
  const url=RAW_BASE+item.path.split('/').map(encodeURIComponent).join('/');
  const response=await fetcher(url);
  if(!response.ok)throw new Error('Não foi possível carregar esta cifra do GitHub.');
  const text=(await response.text()).replace(/^﻿/,'').trim();
  if(!text)throw new Error('Este arquivo de cifra está vazio.');
  const firstLine=text.split(/\r?\n/).map(line=>line.trim()).find(Boolean)||'';
  const header=firstLine.match(/^(.{1,100}?)\s+-\s+(.{1,160})$/);
  const title=header?header[2].trim():item.title;
  const artist=header?header[1].trim():item.artist;
  return {id:`github:${item.path}`,title,artist,key:'',version:item.version,text,source:'Acervo do repositório GitHub',notes:''};
}

export {normalize as normalizeCatalogSearch};
