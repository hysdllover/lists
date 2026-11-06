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
const pz=n=>U('zero')==='0'?String(n):pad(n);
const fmtT=h=>{if(!h)return '';if(U('tfmt')!=='12')return h;const[H,M]=h.split(':').map(Number);return `${H<12?'오전':'오후'} ${H%12||12}:${pad(M)}`};
const when=t=>{let s='';if(t.date){s=fmtD(t.date);if(t.end&&t.end>t.date)s+=' – '+fmtD(t.end)}if(t.time)s+=(s?' ':'')+fmtT(t.time)+(t.tend?'–'+fmtT(t.tend):'');return s};
const tasksOn=(L,s)=>L.filter(t=>t.date&&t.date<=s&&(t.end&&t.end>t.date?t.end:t.date)>=s);
const MONU=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return ymd(d)};
const dayDiff=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const MONS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], DOWS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const U=k=>db.ui[k];
const dowS=d=>U('dow')==='en'?DOWS[d.getDay()]:DOW[d.getDay()];
const dowL=(d,long)=>{const e=DOWE[d.getDay()],k=DOW[d.getDay()]+(long?'요일':'');return U('dow')==='en'?e:U('dow')==='ko'?k:`${e} · ${k}`};
const fmtD=s=>{const d=parse(s),st=U('dstyle');return st==='en'?`${MONS[d.getMonth()]} ${d.getDate()} ${dowS(d)}`:st==='ko'?`${d.getMonth()+1}월 ${d.getDate()}일 ${dowS(d)}`:`${pz(d.getMonth()+1)}.${pz(d.getDate())} ${dowS(d)}`};
const bigD=d=>{const st=U('dstyle');return st==='en'?`${MONS[d.getMonth()]} ${d.getDate()}`:st==='ko'?`${d.getMonth()+1}월 ${d.getDate()}일`:`${pz(d.getMonth()+1)}.${pz(d.getDate())}`};
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const save=(k,v)=>{if(k===KEY){saveDb();return}try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const APP_VER=23;

let db=load(KEY,{tasks:[]});
let cfg=Object.assign({syncInt:'1',noteOpen:'',sort:'date',fold:true,fs:14,theme:'light',split:1,token:'',gist:'',last:0,start:'list',secs:{Quick:true},gfold:{},wz:1},load(CFG,{}));
cfg.device=cfg.device||((/iPad/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1))?'iPad':/iPhone/.test(navigator.userAgent)?'iPhone':'Browser');
const UID={theme:'light',accent:'bluegray',paper:'none',paperPrint:'0',line:'1',dens:'normal',ls:'-0.005',lh:'1.6',dstyle:'dot',dow:'en',weekNo:'1',dday:'1',hol:'1',holX:'',memo:'0',doneBottom:'1',collapse:'1',dimPast:'1',corner:'1',sound:'1',tfmt:'24',zero:'1',ddPos:'both',fLate:'1',fBar:'1',lStat:'1',hCnt:'1',hHol:'1',hEv:'1',rDate:'1',rRep:'1',rMemo:'1',rPlace:'1',snd:'clear',appName:'WEEKLY',tabOrder:'list,week,month,focus,notes',tabHide:'',accentC:'#7489a2',eHide:'',catStyle:'ul',tcol:'1',bigSz:'m',wNoteShow:'0',preset:'default',taskFs:'m',chkColor:'cat',lateColor:'red',tabSz:'m',toastPos:'bottom',toastSec:'5'};
function initDb(){db.tasks=db.tasks||[];db.colors=db.colors||{};db.notes=db.notes||{};db.notesP=db.notesP||{};db.events=db.events||{};db.wfixT=db.wfixT||[[],0];db.wprog=db.wprog||{};db.devices=db.devices||{};db.uiT=db.uiT||0;db.ui=Object.assign({},UID,!db.ui&&cfg.theme?{theme:cfg.theme}:{},db.ui||{})}
initDb();
const HOL={'2026-01-01':'신정','2026-02-16':'설날','2026-02-17':'설날','2026-02-18':'설날','2026-03-01':'삼일절','2026-03-02':'대체공휴일','2026-05-05':'어린이날','2026-05-24':'부처님오신날','2026-05-25':'대체공휴일','2026-06-03':'지방선거','2026-06-06':'현충일','2026-08-15':'광복절','2026-08-17':'대체공휴일','2026-09-24':'추석','2026-09-25':'추석','2026-09-26':'추석','2026-10-03':'개천절','2026-10-05':'대체공휴일','2026-10-09':'한글날','2026-12-25':'성탄절',
'2027-01-01':'신정','2027-02-06':'설날','2027-02-07':'설날','2027-02-08':'설날','2027-02-09':'대체공휴일','2027-03-01':'삼일절','2027-05-05':'어린이날','2027-05-13':'부처님오신날','2027-06-06':'현충일','2027-08-15':'광복절','2027-08-16':'대체공휴일','2027-09-14':'추석','2027-09-15':'추석','2027-09-16':'추석','2027-10-03':'개천절','2027-10-04':'대체공휴일','2027-10-09':'한글날','2027-10-11':'대체공휴일','2027-12-25':'성탄절','2027-12-27':'대체공휴일'};
function holidays(){const m=U('hol')==='1'?{...HOL}:{};for(const l of (U('holX')||'').split('\n')){const r=l.trim().match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);if(r)m[r[1]]=r[2]||'휴일'}return m}
function isoWeek(d){const t=new Date(d.getFullYear(),d.getMonth(),d.getDate()+(d.getDay()===0?1:0));t.setDate(t.getDate()-((t.getDay()+6)%7)+3);const j=new Date(t.getFullYear(),0,4);return 1+Math.round(((t-j)/864e5-3+((j.getDay()+6)%7))/7)}
let eRep='', eStar=false;
let dayMode=null;
let view='list', weekOff=0, editId=null, addDate='', addTime='', rangeTxt='';

const live=()=>db.tasks.filter(t=>!t.deleted);
const find=id=>db.tasks.find(t=>t.id===id);
function commit(){save(KEY,db);render();queueSync()}
const F=['text','done','memo','cat','date','time','repeat','star','order','spawned','deleted','state','end','tend','dord','gone','place','note','prog'];
function setF(t,p,ts){t.u=t.u||{};t.by=cfg.device;for(const k in p){if(JSON.stringify(t[k])===JSON.stringify(p[k]))continue;if(p[k]===undefined)delete t[k];else t[k]=p[k];t.u[k]=ts}t.updated=ts}
function touch(t,p){setF(t,p,now());commit()}
/* undo */
let undoBuf=null,toastT=null;
function snap(label){undoBuf={label,tasks:JSON.parse(JSON.stringify(db.tasks))}}
let noticeFn=null;
function notice(msg,label,fn){undoBuf=null;noticeFn=fn||null;$('#toastTxt').textContent=msg;$('#undoBtn').textContent=label||'';$('#undoBtn').hidden=!label;$('#toast').classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>{$('#toast').classList.remove('on');$('#undoBtn').hidden=false},(+U('toastSec')||5)*1000)}
function toast(){if(!undoBuf)return;noticeFn=null;$('#undoBtn').textContent='되돌리기';$('#undoBtn').hidden=false;$('#toastTxt').textContent=undoBuf.label;$('#toast').classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>{$('#toast').classList.remove('on');undoBuf=null},(+U('toastSec')||5)*1000)}
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
function collapse(rows,cb){
  rows=rows.filter(r=>r.offsetParent);
  if(!rows.length||matchMedia('(prefers-reduced-motion: reduce)').matches){cb();return}
  rows.forEach(r=>{r.style.height=r.offsetHeight+'px'});void document.body.offsetHeight;
  rows.forEach(r=>{r.classList.add('leaving');r.style.height='0px'});setTimeout(cb,230);
}
function finishDone(t){collapse($$(`#open [data-id="${t.id}"]`),()=>finishDone2(t))}
function finishDone2(t){
  popping.delete(t.id);const ts=now();
  snap('완료됨');const p={done:true};
  if(t.repeat&&!t.spawned){const id=uid();
    const nd=nextDate(t.date||todayS(),t.repeat);db.tasks.push({id,text:t.text,done:false,memo:t.memo||'',cat:t.cat||'',date:nd,...(t.end&&t.date?{end:addDays(nd,dayDiff(t.date,t.end))}:{}),time:t.time||'',...(t.tend?{tend:t.tend}:{}),repeat:t.repeat,star:t.star||false,order:t.order,created:ts,updated:ts,by:cfg.device});
    p.spawned=id;undoBuf.label='완료됨 · 다음 반복 생성'}
  setF(t,p,ts);commit();toast();
}

/* ---------- categories ---------- */
const isDark=()=>U('theme')==='dark'||(U('theme')==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
function hexHsl(hex){let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return [Math.round(h),Math.round(s*100),Math.round(l*100)]}
const toneAcc=(hex,dk)=>{const[h,s,l]=hexHsl(hex||'#7489a2');return `hsl(${h}, ${Math.min(s,34)}%, ${dk?Math.max(62,Math.min(74,l+18)):Math.max(44,Math.min(56,l))}%)`};
const toneCat=(hex,dk)=>{const[h,s]=hexHsl(hex);return `hsl(${h}, ${Math.min(s,30)}%, ${dk?50:76}%)`};
function catIdx(c){const v=db.colors[c];if(v&&typeof v[0]==='string')return -1;if(v)return v[0];let h=0;for(const ch of c)h=(h*31+ch.charCodeAt(0))>>>0;return h%6}
const catColor=c=>{const v=db.colors[c];return v&&typeof v[0]==='string'?toneCat(v[0],isDark()):`var(--c${catIdx(c)})`};
const ICON={cal:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3.5" width="11" height="10"/><path d="M2.5 6.5h11M5.5 1.5v3M10.5 1.5v3"/></svg>',clock:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.2l2 1.3"/></svg>',star:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.2l1.75 3.6 3.95.55-2.85 2.8.68 3.95L8 11.25 4.47 13.1l.68-3.95L2.3 6.35l3.95-.55z"/></svg>',set:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4.5h12M2 11.5h12"/><rect x="9.5" y="3" width="2" height="3"/><rect x="4.5" y="10" width="2" height="3"/></svg>',more:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.5" cy="8" r=".6"/><circle cx="8" cy="8" r=".6"/><circle cx="12.5" cy="8" r=".6"/></svg>',l:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5"/></svg>',r:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5"/></svg>'};
ICON.pin='<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14.2s4.5-4.3 4.5-7.7a4.5 4.5 0 0 0-9 0c0 3.4 4.5 7.7 4.5 7.7z"/><circle cx="8" cy="6.5" r="1.4"/></svg>';
ICON.note='<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="10" height="11"/><path d="M5.5 6h5M5.5 8.5h5M5.5 11h3"/></svg>';
const STAR=ICON.star;
const txHTML=t=>{if(!t.cat)return `<span class="tx">${esc(t.text)}</span>`;const c=catColor(t.cat),s=U('catStyle');
  if(s==='dot')return `<i class="cdot" style="background:${c}"></i><span class="tx">${esc(t.text)}</span>`;
  if(s==='bar')return `<span class="tx cbar" style="--ul:${c}">${esc(t.text)}</span>`;
  return `<span class="tx ul" style="--ul:${c}">${esc(t.text)}</span>`};
const ddHTML=t=>{if(!t.date||t.done||U('dday')!=='1')return '';const n=Math.round((parse(t.date)-parse(todayS()))/864e5);return `<span class="dd${n===0?' now':''}">${n===0?'D-DAY':n>0?'D-'+n:'D+'+(-n)}</span>`};
const tagHTML=c=>c?`<span class="tag"><i style="background:${catColor(c)}"></i>${esc(c)}</span>`:'';


/* helpers v11 */
const fmtTs=ts=>{const d=new Date(ts);return `${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`};
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/^[-*] /gm,'• ');
const ccStyle=t=>{const s=[];if(t.cat&&U('chkColor')==='cat')s.push(`--cc:${catColor(t.cat)}`);if(t.prog&&!t.done)s.push(`--pg:${t.prog}%`);return s.length?` style="${s.join(';')}"`:''};
let actx=null;
function tick(kind){
  if(U('sound')!=='1')return;
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const c=actx,t0=c.currentTime,s=kind||U('snd');
    if(s==='paper'){const n=Math.floor(c.sampleRate*.06),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,4);
      const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=buf;f.type='bandpass';f.frequency.value=2600;f.Q.value=.8;g.gain.value=.5;src.connect(f).connect(g).connect(c.destination);src.start(t0);return}
    const [f1,f2,v]=s==='low'?[587,440,.08]:[1046,784,.06];
    const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f1,t0);o.frequency.exponentialRampToValueAtTime(f2,t0+.1);
    g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+(s==='low'?.22:.16));
    o.connect(g).connect(c.destination);o.start(t0);o.stop(t0+.25)}catch{}
}

/* list motion (C26) */
const seen=new Set();
const fresh=t=>{if(seen.has(t.id))return '';seen.add(t.id);return now()-(t.created||0)<2500?' fresh':''};
/* D-day events */
const evList=()=>Object.entries(db.events).filter(([,v])=>v&&v[0]&&!v[0].del).map(([id,v])=>({id,...v[0]}));
function evCalc(e){
  const t0=parse(todayS()), base=parse(e.date);let d=base;
  if(e.mode==='since'){const k=Math.round((t0-base)/864e5)+1;return k>=1?{key:1e5+k,label:`${k}일째`}:{key:1-k,label:`D-${1-k}`}}
  if(e.mode==='yearly'){d=new Date(t0.getFullYear(),base.getMonth(),base.getDate());if(d<t0)d=new Date(t0.getFullYear()+1,base.getMonth(),base.getDate())}
  const n=Math.round((d-t0)/864e5);
  return {key:n>=0?n:2e5-n,label:n===0?'D-DAY':n>0?`D-${n}`:`D+${-n}`};
}
function evOn(s){const out=[];for(const e of evList()){
  if(e.mode==='yearly'){if(e.date.slice(5)===s.slice(5)&&s>=e.date)out.push(e.name);continue}
  if(e.date===s){out.push(e.name);continue}
  if(e.mode==='since'&&s>e.date){const k=Math.round((parse(s)-parse(e.date))/864e5)+1;if(k%100===0)out.push(`${e.name} ${k}일`)}
}return out}
const evPast=e=>e.mode==='once'&&parse(e.date).getTime()<parse(todayS()).getTime()-7*864e5;
function ddStrip(){
  const all=evList(), np=all.filter(evPast).length, vis=cfg.ddPast?all:all.filter(e=>!evPast(e));
  return vis.map(e=>({e,c:evCalc(e)})).sort((a,b)=>a.c.key-b.c.key).map(({e,c})=>`<button class="dchip${c.label==='D-DAY'?' today':''}${evPast(e)?' old':''}" data-ev="${e.id}"><span>${esc(e.name)}</span><b>${c.label}</b></button>`).join('')
    +(np?`<button class="dchip past" data-past="1"><span>${cfg.ddPast?'지난 디데이 접기':'지난 '+np}</span></button>`:'')
    +'<button class="dchip new" data-ev=""><span>+ D-Day</span></button>';
}

const plcHTML=t=>t.place&&U('rPlace')==='1'?`<a class="plc" href="https://maps.apple.com/?q=${encodeURIComponent(t.place)}" target="_blank" rel="noopener">${ICON.pin}${esc(t.place)}</a>`:'';

/* storage: IndexedDB (K6) */
let dbT=null, idbOk=true, dbReady=false;
function saveDb(){if(!dbReady)return;clearTimeout(dbT);dbT=setTimeout(flushDb,150);try{localStorage.setItem('weekly.ui',JSON.stringify({theme:db.ui.theme}))}catch{}}
async function flushDb(){if(!dbReady)return;clearTimeout(dbT);if(idbOk){try{await kv('readwrite',s=>s.put(db,'db'));return}catch{idbOk=false}}try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
addEventListener('pagehide',()=>flushDb());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushDb()});
/* changes (K9, K10) */
const CHANGES={
 23:'데이터 불러오기 전 저장·동기화 차단(안전장치) · 날짜 없는 칸 다시 펼침',
 22:'날짜 없는 할 일을 WEEK·TODAY 맨 아래에 작은 칩으로 표시',
 21:'날짜 없는 할 일 요일 칩 · 날짜 없는 칸 접기 · 하루 크게 보기 · 진행률 · 테마 묶음 · 할 일 글자 크기 · 체크·지난 일 색 · 하단 탭 크기 · 알림 위치·시간 · 상단 문구 정리',
 20:'날짜 없는 할 일 칸이 스크롤을 따라오지 않도록 변경',
 19:'주간 화면 맨 위에 날짜 없는 할 일 칸 · 칸에서 바로 추가 · 주간 메모는 설정에서 표시',
 18:'동기화 호출 절약 · 바뀐 것만 확인 · 바뀐 파일만 올리기 · 남은 API 호출 표시',
 17:'노트 충돌 사본 · 동기화 파일 분리 · 빠른 로딩 · 큰 저장소 · 자동 재시도 · 정보 탭 · 편집 창 항목 고르기 · 분류 표시 방식 · 시간 열 · 체크·취소선 애니메이션',
 16:'노트 · 앱 날짜·시간 선택기 · 탭 순서와 숨기기 · 앱 이름 · 동기화 주기 · 직접 고르는 색 · 완료 소리 종류',
 15:'보이는 화면만 갱신 · 동기화 충돌 알림 · 주간 메모 서식 · 캘린더 기간 막대와 주 번호 · 장소',
 14:'주간 보기 메모 표시',
 13:'월간 캘린더 · 진행 중·보류 · 휴지통 · 기간 일정 · 시간 범위 · 요일 칸 순서 · 단축어 주소',
 12:'디자인 체계 정리 · 3탭 구성 · 스와이프 · 디데이 · 화면 꺼짐 방지',
 11:'설정 묶음 · 수정 되돌리기 · 버전 기록 복원 · 주간 항목 · 확대·축소 · 기기 이름',
 10:'주간 메모 · 계획 모드 · TODAY · 보관함 · 표시 설정 · 공휴일 · 설정 동기화'};
