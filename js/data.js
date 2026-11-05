/* ---------- font (IndexedDB) ---------- */
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('weekly',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function kv(mode,fn){const d=await idb();return new Promise((res,rej)=>{const tx=d.transaction('kv',mode);const r=fn(tx.objectStore('kv'));tx.oncomplete=()=>res(r&&r.result);tx.onerror=()=>rej(tx.error)})}
async function applyFont(){
  try{
    const f=await kv('readonly',s=>s.get('font'));
    if(!f){['--font','--mono'].forEach(v=>document.documentElement.style.removeProperty(v));$('#fontName').textContent='기본 (Noto Sans KR)';return}
    const ff=new FontFace('UserFont',f.buf);await ff.load();document.fonts.add(ff);
    ['--font','--mono'].forEach(v=>document.documentElement.style.setProperty(v,'"UserFont",-apple-system,sans-serif'));
    $('#fontName').textContent=f.name;
  }catch(e){$('#fontName').textContent='폰트를 불러오지 못했습니다'}
}
$('#fontFile').addEventListener('change',async e=>{
  const file=e.target.files[0]; if(!file)return;
  const buf=await file.arrayBuffer();
  try{await new FontFace('Test',buf).load()}catch{alert('지원하지 않는 폰트 파일입니다.');return}
  await kv('readwrite',s=>s.put({name:file.name,buf},'font'));applyFont();e.target.value='';
});
$('#fontReset').onclick=async()=>{await kv('readwrite',s=>s.delete('font'));applyFont()};

/* ---------- backup ---------- */
$('#exp').onclick=()=>{
  const b=new Blob([JSON.stringify({tasks:live(),colors:db.colors,notes:db.notes,ui:db.ui,uiT:db.uiT,wfixT:db.wfixT,wprog:db.wprog,events:db.events},null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`weekly-${todayS()}.json`;a.click();
};
$('#imp').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  try{const d=JSON.parse(await f.text());db.tasks=merge(db.tasks,(d.tasks||[]).map(t=>({...t,updated:t.updated||now()})));db.colors=mergeColors(db.colors,d.colors||{});db.notes=mergeColors(db.notes,d.notes||{});db.wprog=mergeColors(db.wprog,d.wprog||{});db.events=mergeColors(db.events,d.events||{});if(d.wfixT&&d.wfixT[1]>db.wfixT[1])db.wfixT=d.wfixT;if((d.uiT||0)>db.uiT){db.ui={...UID,...d.ui};db.uiT=d.uiT}commit()}catch{alert('JSON 형식이 올바르지 않습니다.')}
  e.target.value='';
});
$('#clr').onclick=()=>{const d=live().filter(t=>t.done);if(d.length){snap(`완료 항목 ${d.length}개 삭제됨`);const t=now();d.forEach(x=>setF(x,{deleted:true},t));commit();toast()}};

/* ---------- GitHub Gist sync ---------- */
const GFILE='weekly-todo.json';
const ft=(t,f)=>t.u?(t.u[f]||t.created||0):(t.updated||0);
function norm(t){const r={id:t.id};for(const f of F)if(t[f]!==undefined)r[f]=t[f];if(t.by)r.by=t.by;r.created=t.created;r.updated=t.updated;
  const u={};for(const f of F){const v=t.u?t.u[f]:t.updated;if(v&&v>t.created)u[f]=v}r.u=u;return r}
function mergeTask(a,b){
  const r={id:a.id,created:Math.min(a.created||0,b.created||0)||a.created||b.created,updated:Math.max(a.updated||0,b.updated||0),u:{},by:((b.updated||0)>(a.updated||0)?b:a).by};
  for(const f of F){const ta=ft(a,f),tb=ft(b,f);
    const pick=tb>ta||(tb===ta&&JSON.stringify(b[f])>JSON.stringify(a[f]))?b:a;
    if(pick[f]!==undefined)r[f]=pick[f];r.u[f]=Math.max(ta,tb)}
  return norm(r);
}
function merge(a,b){
  const m=new Map();
  for(const t of [...a,...b]){const o=m.get(t.id);m.set(t.id,o?mergeTask(o,t):norm(t))}
  const cut=now()-30*864e5;
  return [...m.values()].filter(t=>!(t.deleted&&ft(t,'deleted')<cut));
}
function mergeColors(a,b){const r={...a};for(const k in b)if(!r[k]||b[k][1]>r[k][1])r[k]=b[k];return r}
const ready=()=>!!cfg.token;
function setStatus(cls,txt){$('#dot').className='dot '+cls;$('#syncTxt').textContent=txt}
async function gh(method,path,body){
  const r=await fetch('https://api.github.com'+path,{method,cache:'no-store',headers:{Authorization:`token ${cfg.token}`,Accept:'application/vnd.github+json',...(body?{'Content-Type':'application/json'}:{})},body:body&&JSON.stringify(body)});
  if(!r.ok){const e=new Error(r.status===401?'토큰 오류':r.status===403?'권한(gist) 확인':r.status===404?'Gist 없음':'HTTP '+r.status);e.status=r.status;throw e}
  return r.json();
}
async function findGist(){
  for(let p=1;p<=10;p++){
    const l=await gh('GET',`/gists?per_page=100&page=${p}`);
    const g=l.find(x=>x.files&&x.files[GFILE]); if(g)return g.id;
    if(l.length<100)break;
  }
  const g=await gh('POST','/gists',{description:'Weekly to-do data',public:false,files:{[GFILE]:{content:JSON.stringify({tasks:[]})}}});
  return g.id;
}
async function readGist(g){
  const f=g.files&&g.files[GFILE]; if(!f)return {tasks:[],colors:{},notes:{},wfixT:[[],0],wprog:{},events:{}};
  let c=f.content;
  if(f.truncated)c=await (await fetch(f.raw_url,{cache:'no-store'})).text();
  try{const j=JSON.parse(c||'{}');return {tasks:j.tasks||[],colors:j.colors||{},notes:j.notes||{},ui:j.ui,uiT:j.uiT||0,wfixT:j.wfixT||[[],0],wprog:j.wprog||{},events:j.events||{},by:j.by,at:j.at}}catch{return {tasks:[],colors:{},notes:{},wfixT:[[],0],wprog:{},events:{}}}
}
let syncing=false, again=false, timer=null;
let lastErr='', dirty=false;
function queueSync(){if(!ready())return;dirty=true;clearTimeout(timer);timer=setTimeout(sync,1200)}
async function sync(){
  if(!ready()){setStatus('','LOCAL');return}
  if(syncing){again=true;return}
  syncing=true;setStatus('busy','SYNC');
  try{
    if(!cfg.gist){cfg.gist=await findGist();save(CFG,cfg);fillCfg()}
    let g;
    try{g=await gh('GET',`/gists/${cfg.gist}`)}
    catch(e){if(e.status!==404)throw e;cfg.gist=await findGist();save(CFG,cfg);fillCfg();g=await gh('GET',`/gists/${cfg.gist}`)}
    const remote=await readGist(g), merged=merge(db.tasks,remote.tasks), colors=mergeColors(db.colors,remote.colors), notes=mergeColors(db.notes,remote.notes);
    const rNew=(remote.uiT||0)>db.uiT, ui=rNew?{...UID,...remote.ui}:db.ui, uiT=Math.max(remote.uiT||0,db.uiT);
    const events=mergeColors(db.events,remote.events), wprog=mergeColors(db.wprog,remote.wprog), wfixT=(remote.wfixT[1]||0)>(db.wfixT[1]||0)?remote.wfixT:db.wfixT;
    const kv2=o=>Object.keys(o).sort().map(k=>[k,o[k]]);
    const sig=(t,c,n,u,ut,wf,wp,ev)=>JSON.stringify([[...t].sort((p,q)=>p.id<q.id?-1:1),kv2(c),kv2(n),u?kv2(u):null,ut,wf,kv2(wp),kv2(ev||{})]);
    const all=sig(merged,colors,notes,ui,uiT,wfixT,wprog,events);
    if(all!==sig(db.tasks,db.colors,db.notes,db.ui,db.uiT,db.wfixT,db.wprog,db.events)&&!drag){Object.assign(db,{tasks:merged,colors,notes,ui,uiT,wfixT,wprog,events});save(KEY,db);render()}
    if(remote.by)cfg.lastBy=`${remote.by} · ${fmtTs(remote.at||0)}`;
    if(all!==sig(remote.tasks,remote.colors,remote.notes,remote.ui,remote.uiT||0,remote.wfixT,remote.wprog,remote.events)){const at=now();await gh('PATCH',`/gists/${cfg.gist}`,{files:{[GFILE]:{content:JSON.stringify({tasks:merged,colors,notes,ui,uiT,wfixT,wprog,events,by:cfg.device,at},null,1)}}});cfg.lastBy=`${cfg.device} · ${fmtTs(at)}`}
    cfg.last=now();save(CFG,cfg);dirty=false;lastErr='';
    const d=new Date(cfg.last);setStatus('ok',`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    $('#gLast').textContent=`LAST SYNC ${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }catch(e){lastErr=e.message==='Failed to fetch'||e.message==='Load failed'?'오프라인':e.message;setStatus('err',lastErr)}
  syncing=false;if(again){again=false;queueSync()}
}
function fillCfg(){$('#gToken').value=cfg.token;$('#gId').value=cfg.gist||''}
$('#gSave').onclick=()=>{
  cfg.token=$('#gToken').value.trim();
  cfg.gist=$('#gId').value.trim().replace(/^.*gist\.github\.com\/(?:[^/]+\/)?/,'').replace(/[/#?].*$/,'');
  save(CFG,cfg);fillCfg();sync();
};
$('#gNow').onclick=()=>sync();
$('#gOff').onclick=()=>{if(confirm('동기화 설정을 이 기기에서 삭제할까요? (할 일 데이터는 유지됩니다)')){cfg.token='';cfg.gist='';save(CFG,cfg);fillCfg();setStatus('','LOCAL')}};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){render();sync()}});
setInterval(()=>{if(document.visibilityState==='visible'&&ready())sync()},60000);


/* ---------- sync info / history (82, 68) ---------- */
function syncInfo(){
  const st=!ready()?'로컬 전용':syncing?'동기화 중':lastErr?'오류':dirty?'업로드 대기':'최신 상태';
  const row=(k,v)=>`<div class="pr"><span>${k}</span><b>${v}</b></div>`;
  return row('상태',st)+row('마지막 동기화',cfg.last?fmtTs(cfg.last):'—')+row('마지막 업로드',esc(cfg.lastBy||'—'))+(lastErr?row('오류',esc(lastErr)):'')+row('이 기기',esc(cfg.device))+row('Gist',cfg.gist?esc(cfg.gist.slice(0,10))+'…':'—')+(ready()?'<button class="btn pri" id="pvSync">지금 동기화</button>':'');
}
$('#gHist').onclick=async()=>{
  const box=$('#gHistList');
  if(!ready()||!cfg.gist){box.innerHTML='<p class="note">먼저 Gist 동기화를 연결하세요.</p>';return}
  box.innerHTML='<p class="note">불러오는 중…</p>';
  try{const l=await gh('GET',`/gists/${cfg.gist}/commits?per_page=40`);
    box.innerHTML=l.map(c=>`<div class="field hv"><span>${fmtTs(Date.parse(c.committed_at))}</span><span class="hvn">+${(c.change_status||{}).additions||0} −${(c.change_status||{}).deletions||0}</span><button class="btn sm" data-ver="${c.version}">복원</button></div>`).join('')||'<p class="note">기록이 없습니다.</p>'}
  catch(e){box.innerHTML=`<p class="note">${esc(e.message)}</p>`}
};
$('#gHistList').addEventListener('click',async e=>{
  const b=e.target.closest('[data-ver]');if(!b||!confirm('이 시점의 할 일 상태로 되돌릴까요?\n되돌린 직후에는 실행 취소할 수 있어요.'))return;
  try{restoreFrom(await readGist(await gh('GET',`/gists/${cfg.gist}/${b.dataset.ver}`)))}catch(err){alert(err.message)}
});
function restoreFrom(o){
  snap('이전 버전으로 복원됨');const ts=now(),m=new Map(o.tasks.map(t=>[t.id,t]));
  for(const t of db.tasks){const x=m.get(t.id);
    if(!x){if(!t.deleted)setF(t,{deleted:true},ts);continue}
    const p={};for(const f of F)if(JSON.stringify(x[f])!==JSON.stringify(t[f]))p[f]=x[f];
    if(Object.keys(p).length)setF(t,p,ts);m.delete(t.id)}
  for(const x of m.values()){const n=norm(x);n.u={};for(const f of F)if(n[f]!==undefined)n.u[f]=ts;n.updated=ts;n.by=cfg.device;db.tasks.push(n)}
  for(const k in o.colors)db.colors[k]=[o.colors[k][0],ts];
  for(const k in o.notes)db.notes[k]=[o.notes[k][0],ts];
  for(const k in (o.events||{}))db.events[k]=[o.events[k][0],ts];
  commit();toast();
}
