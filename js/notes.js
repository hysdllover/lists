/* ---------- notes (K5, K9, K10, K11, K14, K15) ---------- */
const noteList=()=>Object.entries(db.notesP).filter(([,v])=>v&&v[0]&&!v[0].del).map(([id,v])=>({id,...v[0],ts:v[1]}));
const noteGet=id=>id&&db.notesP[id]&&!db.notesP[id][0].del?{id,...db.notesP[id][0],ts:db.notesP[id][1]}:null;
const noteTitle=n=>((n.body||'').split('\n').find(l=>l.trim())||'').replace(/^#+\s*/,'').trim()||'제목 없음';
const noteSnip=n=>{const ls=(n.body||'').split('\n').filter(l=>l.trim());return (ls[1]||'').replace(/^(#+|[-*])\s*/,'').replace(/\*\*/g,'')};
function noteSave(id,patch,quiet){const cur=db.notesP[id]?db.notesP[id][0]:{body:''};db.notesP[id]=[{...cur,...patch},now()];save(KEY,db);queueSync();if(!quiet)renderNotes()}
const notesOn=s=>noteList().filter(n=>n.date===s);
const noteTag=n=>`<button class="hn nt" data-note="${n.id}">${ICON.note}${esc(noteTitle(n))}</button>`;
function mdNote(body){
  const inl=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
  let first=true;
  return body.split('\n').map((l,i)=>{
    if(!l.trim())return `<div class="nl br" data-i="${i}"></div>`;
    let h;
    if(/^---+\s*$/.test(l))h='<hr>';
    else if(/^#{2,}\s/.test(l))h=`<div class="nl h4" data-i="${i}">${inl(l.replace(/^#+\s*/,''))}</div>`;
    else if(/^#\s/.test(l))h=`<div class="nl h3" data-i="${i}">${inl(l.slice(2))}</div>`;
    else if(/^[-*]\s/.test(l))h=`<div class="nl li" data-i="${i}">${inl(l.slice(2))}</div>`;
    else h=`<div class="nl" data-i="${i}">${inl(l)}</div>`;
    if(first){first=false;h=h.replace('class="nl','class="nl ttl')}
    return h;
  }).join('');
}
function renderNotes(){
  const L=noteList().sort((a,b)=>(!!b.pin-!!a.pin)||b.ts-a.ts), cur=noteGet(cfg.noteOpen)?cfg.noteOpen:'';
  $('#nCount').textContent=`${L.length} Notes`;
  $('#nList').innerHTML=L.map(n=>`<li class="ni${n.id===cur?' on':''}${n.pin?' pinned':''}" data-nid="${n.id}"><div class="nit">${esc(noteTitle(n))}${n.pin?'<span class="pinm">PIN</span>':''}</div>${noteSnip(n)?`<div class="nis">${esc(noteSnip(n))}</div>`:''}<div class="meta">${n.date?`<span class="date">${fmtD(n.date)}</span>`:''}<span class="dn">${bigD(new Date(n.ts))}</span></div></li>`).join('')||'<li class="empty">노트가 없습니다</li>';
  $('#vNotes').classList.toggle('open',!!cur);
  $('#nEdit').hidden=!cur;
  if(!cur)return;
  const n=noteGet(cur), ta=$('#nBody');
  if(document.activeElement!==ta){ta.value=n.body||'';$('#nView').innerHTML=mdNote(n.body||'');$('#nEdit').classList.toggle('reading',!!(n.body||'').trim())}
  $('#nPin').classList.toggle('on',!!n.pin);setDP($('#nDate'),n.date||'');
  const lk=live().filter(t=>t.note===cur);
  $('#nLinks').innerHTML=lk.length?`<span class="lbl">Linked tasks · ${lk.length}</span>${lk.map(t=>`<button class="nlk${t.done?' done':''}" data-tid="${t.id}">${t.done?'✓ ':''}${esc(t.text.split('\n')[0])}${t.date?` <small>${fmtD(t.date)}</small>`:''}</button>`).join('')}`:'';
}
function openNote(id){view='notes';cfg.noteOpen=id;cfg.lastView='notes';save(CFG,cfg);render();scrollTo(0,0)}
function newNote(body=''){const id=uid();db.notesP[id]=[{body,pin:false,date:''},now()];save(KEY,db);queueSync();return id}
$('#nNew').onclick=()=>{cfg.noteOpen=newNote();save(CFG,cfg);renderNotes();editNote()};
$('#nList').addEventListener('click',e=>{const li=e.target.closest('[data-nid]');if(!li)return;cfg.noteOpen=li.dataset.nid;save(CFG,cfg);renderNotes();if(innerWidth<768)scrollTo(0,0)});
$('#nBack').onclick=()=>{cfg.noteOpen='';save(CFG,cfg);renderNotes()};
$('#nPin').onclick=()=>{const n=noteGet(cfg.noteOpen);if(n)noteSave(n.id,{pin:!n.pin})};
$('#nDate').addEventListener('change',()=>{if(cfg.noteOpen)noteSave(cfg.noteOpen,{date:getV('#nDate')})});
$('#nDel').onclick=()=>{const n=noteGet(cfg.noteOpen);if(n&&confirm(`"${noteTitle(n)}" 노트를 삭제할까요?`)){noteSave(n.id,{del:1},true);cfg.noteOpen='';save(CFG,cfg);renderNotes()}};
function editNote(){$('#nEdit').classList.remove('reading');const ta=$('#nBody');ta.focus();grow(ta)}
$('#nView').addEventListener('click',e=>{if(e.target.closest('a')||nlNoClick){nlNoClick=false;return}editNote()});
let nT=null;
$('#nBody').addEventListener('input',e=>{const id=cfg.noteOpen,v=e.target.value;clearTimeout(nT);nT=setTimeout(()=>{if(id&&noteGet(id)){noteSave(id,{body:v},true);const li=$(`[data-nid="${id}"] .nit`);if(li)li.firstChild.textContent=noteTitle({body:v})}},400)});
$('#nBody').addEventListener('focus',()=>{$('#nTools').hidden=false;placeTools()});
$('#nBody').addEventListener('blur',e=>{clearTimeout(nT);const v0=e.target.value;if(cfg.noteOpen&&noteGet(cfg.noteOpen)&&noteGet(cfg.noteOpen).body!==v0)noteSave(cfg.noteOpen,{body:v0},true);setTimeout(()=>{if(document.activeElement!==e.target){$('#nTools').hidden=true;const v=e.target.value;$('#nView').innerHTML=mdNote(v);$('#nEdit').classList.toggle('reading',!!v.trim());renderNotes()}},120)});
$('#nLinks').addEventListener('click',e=>{const b=e.target.closest('[data-tid]');if(b)openEdit(b.dataset.tid)});
/* toolbar (K14) */
function placeTools(){const vv=window.visualViewport,t=$('#nTools');if(!vv){t.style.bottom='0px';return}t.style.bottom=Math.max(0,innerHeight-vv.height-vv.offsetTop)+'px'}
if(window.visualViewport){visualViewport.addEventListener('resize',placeTools);visualViewport.addEventListener('scroll',placeTools)}
$('#nTools').addEventListener('pointerdown',e=>e.preventDefault());
$('#nTools').addEventListener('click',e=>{
  const b=e.target.closest('[data-t]');if(!b)return;const ta=$('#nBody'),v=ta.value,s=ta.selectionStart,en=ta.selectionEnd;
  const ls=v.lastIndexOf('\n',s-1)+1, le=v.indexOf('\n',en)<0?v.length:v.indexOf('\n',en), t=b.dataset.t;
  if(t==='b'){const sel=v.slice(s,en)||'굵게';ta.setRangeText(`**${sel}**`,s,en,'end')}
  else if(t==='li'||t==='h'){const p=t==='li'?'- ':'# ';ta.setRangeText(v.slice(ls,le).split('\n').map(l=>l.startsWith(p)?l.slice(p.length):p+l.replace(/^(#+|[-*])\s/,'')).join('\n'),ls,le,'end')}
  else if(t==='hr')ta.setRangeText('\n---\n',en,en,'end');
  else if(t==='task'){noteLineToTask(v.slice(ls,le));return}
  ta.dispatchEvent(new Event('input',{bubbles:true}));ta.focus();
});
/* line -> task (K10) */
function noteLineToTask(line){
  const text=line.replace(/^(#+|[-*])\s*/,'').replace(/\*\*/g,'').trim();if(!text)return;
  snap('노트에서 할 일 추가됨');addTask(text,'','',{note:cfg.noteOpen});toast();
}
let nlT=null, nlNoClick=false;
$('#nView').addEventListener('pointerdown',e=>{const l=e.target.closest('.nl:not(.br)');if(!l)return;clearTimeout(nlT);
  nlT=setTimeout(()=>{nlNoClick=true;pvHold=now();showPv(l,`<span class="lbl">Line</span><button class="mi" data-act="ntask" data-i="${l.dataset.i}">이 줄로 할 일 만들기<small>TASK</small></button>`)},480)});
['pointerup','pointercancel','pointermove'].forEach(ev=>$('#nView').addEventListener(ev,e=>{if(ev!=='pointermove'||Math.abs(e.movementY)>3)clearTimeout(nlT)}));
$('#pv').addEventListener('click',e=>{const b=e.target.closest('[data-act=ntask]');if(!b)return;hidePv();const n=noteGet(cfg.noteOpen);if(n)noteLineToTask((n.body||'').split('\n')[+b.dataset.i]||'')});
/* open note from task / calendar (K11, K15) */
document.addEventListener('click',e=>{const b=e.target.closest('[data-note]');if(!b)return;e.stopPropagation();e.preventDefault();openNote(b.dataset.note)},true);
/* link note in task editor (K11) */
let eNoteV='';
function paintENote(){const n=noteGet(eNoteV);$('#eNote').textContent=n?noteTitle(n):'연결';$('#eNote').classList.toggle('has',!!n)}
$('#eNote').onclick=e=>showPv(e.currentTarget,'<span class="lbl">Link note</span>'+noteList().sort((a,b)=>b.ts-a.ts).slice(0,12).map(n=>`<button class="mi" data-lnote="${n.id}">${esc(noteTitle(n))}<small>${bigD(new Date(n.ts))}</small></button>`).join('')+'<button class="mi" data-lnote="new">+ 새 노트<small>NEW</small></button>'+(eNoteV?'<button class="mi" data-lnote="">연결 해제<small>×</small></button>':''));
$('#pv').addEventListener('click',e=>{const b=e.target.closest('[data-lnote]');if(!b)return;hidePv();
  if(b.dataset.lnote==='new'){eNoteV=newNote(($('#eTxt').value||'').split('\n')[0]+'\n')}else eNoteV=b.dataset.lnote;paintENote()});
