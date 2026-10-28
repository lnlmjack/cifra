export const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLATS = {Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#'};
const PITCH = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
const FLAT_NAMES = {C:'C','C#':'Db',D:'D','D#':'Eb',E:'E',F:'F','F#':'Gb',G:'G','G#':'Ab',A:'A','A#':'Bb',B:'B'};
export const normalizeSearch = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g,'').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ');
export function parseChord(value) {
  const m = String(value).trim().match(/^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/);
  if (!m) return null;
  const root = FLATS[m[1]+m[2]] || m[1]+m[2];
  const bass = m[4] ? (FLATS[m[4]+m[5]] || m[4]+m[5]) : '';
  if (!(root in PITCH) || (bass && !(bass in PITCH))) return null;
  return {root, suffix:m[3] || '', bass};
}
export function transposeNote(note, semitones, preferFlats=false) {
  const normalized = FLATS[note] || note;
  if (!(normalized in PITCH)) return note;
  const index = (PITCH[normalized] + semitones % 12 + 12) % 12;
  return preferFlats ? FLAT_NAMES[NOTES[index]] : NOTES[index];
}
export function transposeChord(chord, semitones, preferFlats=false) {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  return transposeNote(parsed.root,semitones,preferFlats)+parsed.suffix+(parsed.bass?'/'+transposeNote(parsed.bass,semitones,preferFlats):'');
}
export function simplifyChord(chord) {
  const c=parseChord(chord); if(!c) return chord;
  const s=c.suffix;
  let suffix='';
  if (/^(m|min|−)/i.test(s) && !/^maj/i.test(s)) suffix='m';
  else if (/^(dim|°|o)/i.test(s)) suffix='dim';
  else if (/^(aug|\+)/i.test(s)) suffix='+';
  else if (/^sus2/i.test(s)) suffix='sus2';
  else if (/^sus4|^sus$/i.test(s)) suffix='sus4';
  return c.root+suffix+(c.bass?'/'+c.bass:'');
}
export function songChordNames(text) {
  const found=new Set();
  for(const line of String(text||'').split(/\r?\n/)) {
    const bracket=/\[([A-G][#b]?(?:[^\]/]*)?(?:\/[A-G][#b]?)?)\]/g;
    let match; while((match=bracket.exec(line))) if(parseChord(match[1])) found.add(match[1]);
    const trimmed=line.trim();
    if(trimmed) {
      const lineTokens=trimmed.split(/\s+/);
      const chordLine=lineTokens.length>0 && lineTokens.every(token=>parseChord(token));
      if(chordLine) for(const token of lineTokens) found.add(token);
    }
  }
  return [...found];
}
function chordIntervals(suffix) {
  const s=suffix.toLowerCase();
  let intervals=[0,4,7];
  if (/^(m|min|−)/.test(s) && !s.startsWith('maj')) intervals=[0,3,7];
  if (/^(dim|°|o)/.test(s)) intervals=[0,3,6];
  if (/^(aug|\+)/.test(s)) intervals=[0,4,8];
  if (/^sus2/.test(s)) intervals=[0,2,7];
  if (/^sus4|^sus$/.test(s)) intervals=[0,5,7];
  if (/maj7/.test(s)) intervals.push(11);
  else if (/(^|[^a-z])7/.test(s) || /7/.test(s)) intervals.push(10);
  if (/6/.test(s)) intervals.push(9);
  if (/9/.test(s)) intervals.push(2);
  if (/11/.test(s)) intervals.push(5);
  if (/13/.test(s)) intervals.push(9);
  return [...new Set(intervals)];
}
const OPEN_TUNING=[4,9,2,7,11,4]; // cordas 6→1: E A D G B E
export function chordVoicing(label) {
  const c=parseChord(label); if(!c) return null;
  const root=PITCH[c.root], tones=chordIntervals(c.suffix).map(i=>(root+i)%12);
  if(c.bass && !tones.includes(PITCH[c.bass])) tones.push(PITCH[c.bass]);
  let best=null, bestScore=Infinity;
  const choices=OPEN_TUNING.map(open=>Array.from({length:14},(_,f)=>(open+f)%12).map((pitch,f)=>tones.includes(pitch)?f:null).filter(f=>f!==null));
  function visit(i,frets){
    if(i===6){
      const sounding=frets.filter(f=>f!==-1); if(sounding.length<3) return;
      const pitches=sounding.map((f,j)=>(OPEN_TUNING[j]+f)%12);
      if(!pitches.includes(root)|| (c.bass && pitches[0]!==PITCH[c.bass])) return;
      const positive=sounding.filter(f=>f>0),low=positive.length?Math.min(...positive):0,high=positive.length?Math.max(...positive):0;
      if(high-low>4) return;
      const score=high*2+positive.length*.25+frets.filter(f=>f===-1).length*.35+Math.abs(frets[0]===-1?0:frets[0]-(c.bass?0:root===4?0:0))*.01;
      if(score<bestScore){bestScore=score;best=frets.slice();} return;
    }
    for(const fret of [-1,...choices[i]]) { frets.push(fret); visit(i+1,frets); frets.pop(); }
  }
  visit(0,[]);
  return best;
}
export function searchSongs(query,songs) {
  const q=normalizeSearch(query); if(!q) return [];
  const terms=q.split(' ');
  return songs.map(song=>({song,score:(normalizeSearch(song.title+' '+song.artist).includes(q)?3:terms.every(term=>normalizeSearch(song.title+' '+song.artist).includes(term))?1:0)})).filter(x=>x.score).sort((a,b)=>b.score-a.score||a.song.title.localeCompare(b.song.title,'pt-BR')).map(x=>x.song);
}
export function validateSong(song) {
  if(!song || typeof song!=='object') throw new Error('Dados da cifra inválidos.');
  const title=String(song.title||'').trim(), text=String(song.text||'').trim();
  if(!title) throw new Error('Informe o título da música.');
  if(!text) throw new Error('Informe a letra ou cifra.');
  return {id:String(song.id||globalThis.crypto?.randomUUID?.()||Date.now()),title,artist:String(song.artist||'').trim(),key:String(song.key||''),version:String(song.version||'normal'),text,source:String(song.source||'Cadastrada por você'),notes:String(song.notes||''),updatedAt:Date.now()};
}
export function renderSongText(text,semitones=0,preferFlats=false,simplify=false) {
  return String(text||'').split(/\r?\n/).map(line=>line.replace(/\[([^\]]+)\]/g,(all,chord)=>parseChord(chord)?'['+(simplify?simplifyChord(transposeChord(chord,semitones,preferFlats)):transposeChord(chord,semitones,preferFlats))+']':all).replace(/(^|\s)([A-G][#b]?(?:m|min|maj|sus\d?|dim|aug|add|\d|\+|°|ø|−|[-#b])*(?:\/[A-G][#b]?)?)(?=\s|$)/g,(all,prefix,chord)=>parseChord(chord)?prefix+(simplify?simplifyChord(transposeChord(chord,semitones,preferFlats)):transposeChord(chord,semitones,preferFlats)):all)).join('\n');
}
