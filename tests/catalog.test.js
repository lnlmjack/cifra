import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCatalog,searchCatalog,loadCatalogSong} from '../src/catalog.js';

const tree={tree:[
  {type:'blob',path:'cifras/A/Aerosmith/adams-apple.txt'},
  {type:'blob',path:'cifras/A/Aerosmith/._adams-apple.txt'},
  {type:'blob',path:'cifras/B/Banda/Évidências (versão 2).txt'},
  {type:'blob',path:'cifras/teste.html'},
  {type:'tree',path:'cifras/A/Aerosmith'}
]};

test('monta catálogo de arquivos .txt e ignora metadados AppleDouble',()=>{
  const catalog=buildCatalog(tree);
  assert.equal(catalog.length,2);
  assert.deepEqual(catalog[0],{path:'cifras/A/Aerosmith/adams-apple.txt',title:'adams apple',artist:'Aerosmith',version:'normal'});
});

test('pesquisa no catálogo sem diferenciar acentos ou caixa',()=>{
  const catalog=buildCatalog(tree);
  assert.equal(searchCatalog('evidencias',catalog)[0].title,'Évidências (versão 2)');
  assert.equal(searchCatalog('aerosmith adams',catalog)[0].artist,'Aerosmith');
  assert.deepEqual(searchCatalog('x',catalog),[]);
});

test('recusa catálogo que o GitHub marcou como truncado',()=>{
  assert.throws(()=>buildCatalog({...tree,truncated:true}),/limitou a lista/);
});

test('carrega arquivo escolhido e separa artista e título do cabeçalho',async()=>{
  let requested='';
  const song=await loadCatalogSong(buildCatalog(tree)[0],async url=>{
    requested=url;
    return {ok:true,text:async()=> '﻿Aerosmith - Adams Apple\n\n[G]riff\n'};
  });
  assert.match(requested,/raw\.githubusercontent\.com\/lnlmjack\/cifra\/main\/cifras\/A\/Aerosmith\/adams-apple\.txt$/);
  assert.equal(song.title,'Adams Apple');
  assert.equal(song.artist,'Aerosmith');
  assert.equal(song.text,'Aerosmith - Adams Apple\n\n[G]riff');
});
