const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DOW=['일','월','화','수','목','금','토'], DOWE=['SUN','MON','TUE','WED','THU','FRI','SAT'];
const KEY='weekly.v1', CFG='weekly.cfg';
const now=()=>Date.now();
const uid=()=>now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const todayS=()=>ymd(new Date());
const when=t=>t.date?fmtD(t.date)+(t.time?' '+t.time:''):(t.time||'');
const MONS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], DOWS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const U=k=>db.ui[k];
const dowS=d=>U('dow')==='en'?DOWS[d.getDay()]:DOW[d.getDay()];
const dowL=(d,long)=>{const e=DOWE[d.getDay()],k=DOW[d.getDay()]+(long?'요일':'');return U('dow')==='en'?e:U('dow')==='ko'?k:`${e} · ${k}`};
const fmtD=s=>{const d=parse(s),st=U('dstyle');return st==='en'?`${MONS[d.getMonth()]} ${d.getDate()} ${dowS(d)}`:st==='ko'?`${d.getMonth()+1}월 ${d.getDate()}일 ${dowS(d)}`:`${pad(d.getMonth()+1)}.${pad(d.getDate())} ${dowS(d)}`};
const bigD=d=>{const st=U('dstyle');return st==='en'?`${MONS[d.getMonth()]} ${d.getDate()}`:st==='ko'?`${d.getMonth()+1}월 ${d.getDate()}일`:`${pad(d.getMonth()+1)}.${pad(d.getDate())}`};
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

let db=load(KEY,{tasks:[]}); db.colors=db.colors||{};
let cfg=Object.assign({sort:'date',fold:true,fs:14,theme:'light',split:1,token:'',gist:'',last:0,start:'list',secs:{Quick:true},gfold:{},wz:1},load(CFG,{}));
cfg.device=cfg.device||((/iPad/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1))?'iPad':/iPhone/.test(navigator.userAgent)?'iPhone':'Browser');
const UID={theme:'light',accent:'bluegray',paper:'none',paperPrint:'0',line:'1',dens:'normal',ls:'-0.005',lh:'1.6',dstyle:'dot',dow:'en',weekNo:'1',dday:'1',hol:'1',holX:'',memo:'0',doneBottom:'1',collapse:'1',dimPast:'1',corner:'1',sound:'1'};
db.notes=db.notes||{};db.wfixT=db.wfixT||[[],0];db.wprog=db.wprog||{};db.uiT=db.uiT||0;db.ui=Object.assign({},UID,!db.ui&&cfg.theme?{theme:cfg.theme}:{},db.ui||{});
const HOL={'2026-01-01':'신정','2026-02-16':'설날','2026-02-17':'설날','2026-02-18':'설날','2026-03-01':'삼일절','2026-03-02':'대체공휴일','2026-05-05':'어린이날','2026-05-24':'부처님오신날','2026-05-25':'대체공휴일','2026-06-03':'지방선거','2026-06-06':'현충일','2026-08-15':'광복절','2026-08-17':'대체공휴일','2026-09-24':'추석','2026-09-25':'추석','2026-09-26':'추석','2026-10-03':'개천절','2026-10-05':'대체공휴일','2026-10-09':'한글날','2026-12-25':'성탄절',
'2027-01-01':'신정','2027-02-06':'설날','2027-02-07':'설날','2027-02-08':'설날','2027-02-09':'대체공휴일','2027-03-01':'삼일절','2027-05-05':'어린이날','2027-05-13':'부처님오신날','2027-06-06':'현충일','2027-08-15':'광복절','2027-08-16':'대체공휴일','2027-09-14':'추석','2027-09-15':'추석','2027-09-16':'추석','2027-10-03':'개천절','2027-10-04':'대체공휴일','2027-10-09':'한글날','2027-10-11':'대체공휴일','2027-12-25':'성탄절','2027-12-27':'대체공휴일'};
function holidays(){const m=U('hol')==='1'?{...HOL}:{};for(const l of (U('holX')||'').split('\n')){const r=l.trim().match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);if(r)m[r[1]]=r[2]||'휴일'}return m}
function isoWeek(d){const t=new Date(d.getFullYear(),d.getMonth(),d.getDate()+(d.getDay()===0?1:0));t.setDate(t.getDate()-((t.getDay()+6)%7)+3);const j=new Date(t.getFullYear(),0,4);return 1+Math.round(((t-j)/864e5-3+((j.getDay()+6)%7))/7)}
let eRep='', eStar=false;
let view='list', weekOff=0, editId=null, addDate='', addTime='', rangeTxt='';

const live=()=>db.tasks.filter(t=>!t.deleted);
const find=id=>db.tasks.find(t=>t.id===id);
function commit(){save(KEY,db);render();queueSync()}
const F=['text','done','memo','cat','date','time','repeat','star','order','spawned','deleted'];
function setF(t,p,ts){t.u=t.u||{};t.by=cfg.device;for(const k in p){if(JSON.stringify(t[k])===JSON.stringify(p[k]))continue;if(p[k]===undefined)delete t[k];else t[k]=p[k];t.u[k]=ts}t.updated=ts}
function touch(t,p){setF(t,p,now());commit()}
/* undo */
let undoBuf=null,toastT=null;
function snap(label){undoBuf={label,tasks:JSON.parse(JSON.stringify(db.tasks))}}
function toast(){if(!undoBuf)return;$('#toastTxt').textContent=undoBuf.label;$('#toast').classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>{$('#toast').classList.remove('on');undoBuf=null},5000)}
function undo(){
  if(!undoBuf)return;const ts=now(),old=new Map(undoBuf.tasks.map(t=>[t.id,t]));
  for(const t of db.tasks){const o=old.get(t.id);
    if(!o){if(!t.deleted)setF(t,{deleted:true},ts);continue}
    const p={};for(const f of F)if(JSON.stringify(o[f])!==JSON.stringify(t[f]))p[f]=o[f];
    if(Object.keys(p).length)setF(t,p,ts)}
  undoBuf=null;$('#toast').classList.remove('on');commit();
}
/* repeat */
const REP={daily:'매일',weekdays:'평일',weekly:'매주',monthly:'매월'};
function nextDate(d,r){const x=parse(d);
  if(r==='daily')x.setDate(x.getDate()+1);
  else if(r==='weekdays'){do x.setDate(x.getDate()+1);while(x.getDay()===0||x.getDay()===6)}
  else if(r==='weekly')x.setDate(x.getDate()+7);
  else if(r==='monthly'){const day=x.getDate();x.setDate(1);x.setMonth(x.getMonth()+1);x.setDate(Math.min(day,new Date(x.getFullYear(),x.getMonth()+1,0).getDate()))}
  return ymd(x)}
const popping=new Set();
function toggleDone(t){
  if(t.done){setF(t,{done:false},now());commit();return}
  if(popping.has(t.id))return;popping.add(t.id);
  $$(`[data-id="${t.id}"]`).forEach(r=>r.classList.add('pop'));tick();
  setTimeout(()=>finishDone(t),430);
}
function finishDone(t){
  popping.delete(t.id);const ts=now();
  snap('완료됨');const p={done:true};
  if(t.repeat&&!t.spawned){const id=uid();
    db.tasks.push({id,text:t.text,done:false,memo:t.memo||'',cat:t.cat||'',date:nextDate(t.date||todayS(),t.repeat),time:t.time||'',repeat:t.repeat,star:t.star||false,order:t.order,created:ts,updated:ts});
    p.spawned=id;undoBuf.label='완료됨 · 다음 반복 생성'}
  setF(t,p,ts);commit();toast();
}

/* ---------- categories ---------- */
function catIdx(c){if(db.colors[c])return db.colors[c][0];let h=0;for(const ch of c)h=(h*31+ch.charCodeAt(0))>>>0;return h%6}
const catColor=c=>`var(--c${catIdx(c)})`;
const STAR='<svg viewBox="0 0 16 16"><path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/></svg>';
const txHTML=t=>t.cat?`<span class="tx ul" style="--ul:${catColor(t.cat)}">${esc(t.text)}</span>`:`<span class="tx">${esc(t.text)}</span>`;
const ddHTML=t=>{if(!t.date||t.done||U('dday')!=='1')return '';const n=Math.round((parse(t.date)-parse(todayS()))/864e5);return `<span class="dd${n===0?' now':''}">${n===0?'D-DAY':n>0?'D-'+n:'D+'+(-n)}</span>`};
const tagHTML=c=>c?`<span class="tag"><i style="background:${catColor(c)}"></i>${esc(c)}</span>`:'';


/* helpers v11 */
const fmtTs=ts=>{const d=new Date(ts);return `${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`};
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/^[-*] /gm,'• ');
const ccStyle=t=>t.cat?` style="--cc:${catColor(t.cat)}"`:'';
let actx=null;
function tick(){
  if(U('sound')!=='1')return;
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const c=actx,o=c.createOscillator(),g=c.createGain(),t0=c.currentTime;
    o.type='sine';o.frequency.setValueAtTime(1046,t0);o.frequency.exponentialRampToValueAtTime(784,t0+.09);
    g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.06,t0+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+.16);
    o.connect(g).connect(c.destination);o.start(t0);o.stop(t0+.18)}catch{}
}
