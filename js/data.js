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
  const b=new Blob([JSON.stringify({tasks:live(),colors:db.colors,notes:db.notes,ui:db.ui,uiT:db.uiT,wfixT:db.wfixT,wprog:db.wprog,events:db.events,notesP:db.notesP,devices:db.devices},null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`weekly-${todayS()}.json`;a.click();
};
$('#imp').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  try{const d=JSON.parse(await f.text());db.tasks=merge(db.tasks,(d.tasks||[]).map(t=>({...t,updated:t.updated||now()})));db.colors=mergeColors(db.colors,d.colors||{});db.notes=mergeColors(db.notes,d.notes||{});db.wprog=mergeColors(db.wprog,d.wprog||{});db.events=mergeColors(db.events,d.events||{});db.notesP=mergeColors(db.notesP,d.notesP||{});if(d.wfixT&&d.wfixT[1]>db.wfixT[1])db.wfixT=d.wfixT;if((d.uiT||0)>db.uiT){db.ui={...UID,...d.ui};db.uiT=d.uiT}commit()}catch{alert('JSON 형식이 올바르지 않습니다.')}
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
let apiLeft='';
async function ghx(method,path,body,etag){
  const r=await fetch('https://api.github.com'+path,{method,cache:'no-store',headers:{Authorization:`token ${cfg.token}`,Accept:'application/vnd.github+json',...(etag?{'If-None-Match':etag}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body&&JSON.stringify(body)});
  const rl=r.headers.get('x-ratelimit-remaining');if(rl)apiLeft=rl;
  if(r.status===304)return {status:304};
  if(!r.ok){const e=new Error(r.status===401?'토큰 오류':r.status===403?'권한(gist) 확인':r.status===404?'Gist 없음':'HTTP '+r.status);e.status=r.status;throw e}
  return {status:r.status,json:await r.json(),etag:r.headers.get('etag')||''};
}
async function gh(method,path,body){return (await ghx(method,path,body)).json
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
const NFILE='weekly-notes.json';
async function fileText(f){if(!f)return '';let c=f.content;if(f.truncated)c=await (await fetch(f.raw_url,{cache:'no-store'})).text();return c||''}
async function readGist(g){
  const fs=(g&&g.files)||{};let j={},n={};
  try{j=JSON.parse(await fileText(fs[GFILE])||'{}')}catch{}
  try{n=JSON.parse(await fileText(fs[NFILE])||'{}')}catch{}
  return {tasks:j.tasks||[],colors:j.colors||{},notes:j.notes||{},ui:j.ui,uiT:j.uiT||0,wfixT:j.wfixT||[[],0],wprog:j.wprog||{},events:j.events||{},devices:j.devices||{},
    notesP:mergeColors(j.notesP||{},n.notesP||{}),hasN:!!fs[NFILE],by:j.by,at:j.at};
}
let syncing=false, again=false, timer=null;
let lastErr='', dirty=false, retryN=0, retryT=null, tokWarned=false;
function queueSync(){if(!ready())return;dirty=true;if(cfg.syncInt==='0'){setStatus('busy','PENDING');return}clearTimeout(timer);timer=setTimeout(sync,2500)}
/* change detection: send only what changed, ask GitHub "changed since?" first */
const kv2=o=>Object.keys(o||{}).sort().map(k=>[k,o[k]]);
const sigMainOf=o=>JSON.stringify([o.tasks.map(norm).sort((p,q)=>p.id<q.id?-1:1),kv2(o.colors),kv2(o.notes),o.ui?kv2(o.ui):null,o.uiT||0,o.wfixT,kv2(o.wprog),kv2(o.events)]);
const sigNotesOf=o=>JSON.stringify(kv2(o.notesP));
const h32=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)+'.'+s.length.toString(36)};
const mainPayload=o=>({tasks:o.tasks.map(norm),colors:o.colors,notes:o.notes,ui:o.ui,uiT:o.uiT,wfixT:o.wfixT,wprog:o.wprog,events:o.events,devices:o.devices});
function syncOk(){cfg.last=now();save(CFG,cfg);dirty=false;lastErr='';retryN=0;tokWarned=false;
  const d=new Date(cfg.last);setStatus('ok',`${pad(d.getHours())}:${pad(d.getMinutes())}`);$('#gLast').textContent=`LAST SYNC ${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`}
function openSyncSettings(){view='set';cfg.setTab='data';cfg.secs=cfg.secs||{};cfg.secs['Gist Sync']=true;save(CFG,cfg);render();setTimeout(()=>{const s=$('[data-sec="Gist Sync"]');s&&s.scrollIntoView({block:'start'})},60)}
async function sync(){
  if(!dbReady)return;
  if(!ready()){setStatus('','LOCAL');return}
  if(syncing){again=true;return}
  syncing=true;setStatus('busy','SYNC');clearTimeout(retryT);
  try{
    if(!cfg.gist){cfg.gist=await findGist();save(CFG,cfg);fillCfg()}
    let res;
    try{res=await ghx('GET',`/gists/${cfg.gist}`,null,cfg.etag&&cfg.sigM?cfg.etag:'')}
    catch(e){if(e.status!==404)throw e;cfg.gist=await findGist();cfg.etag='';save(CFG,cfg);fillCfg();res=await ghx('GET',`/gists/${cfg.gist}`)}
    if(res.status===304&&!db.tasks.length){cfg.etag='';res=await ghx('GET',`/gists/${cfg.gist}`)}
    if(res.status===304){
      /* nothing changed on GitHub since our last sync: upload only our own changes, without downloading */
      const hm=h32(sigMainOf(db)), hn=h32(sigNotesOf(db)), stale=!(db.devices[cfg.device]&&db.devices[cfg.device][1]>now()-6*36e5), files={}, at=now();
      if(hm!==cfg.sigM||stale){if(stale){db.devices[cfg.device]=[at,at];save(KEY,db)}files[GFILE]={content:JSON.stringify({...mainPayload(db),by:cfg.device,at},null,1)}}
      if(hn!==cfg.sigN)files[NFILE]={content:JSON.stringify({notesP:db.notesP},null,1)};
      if(Object.keys(files).length){const pr=await ghx('PATCH',`/gists/${cfg.gist}`,{files});cfg.etag=pr.etag||'';cfg.lastBy=`${cfg.device} · ${fmtTs(at)}`}
      cfg.sigM=hm;cfg.sigN=hn;syncOk();syncing=false;if(again){again=false;queueSync()}return;
    }
    cfg.etag=res.etag||'';
    const g=res.json, remote=await readGist(g), since=cfg.last||0, conf=[], lm=new Map(db.tasks.map(t=>[t.id,t]));
    for(const r of remote.tasks){const l=lm.get(r.id);if(!l)continue;for(const f of F){if(f==='order'||f==='dord')continue;if(JSON.stringify(l[f])===JSON.stringify(r[f]))continue;const tl=ft(l,f),tr=ft(r,f);if(tl>since&&tr>since&&tr!==tl)conf.push({t:l,f,by:tr>tl?(r.by||'다른 기기'):cfg.device,vs:tr>tl?cfg.device:(r.by||'다른 기기')})}}
    /* note conflict copies (K1) */
    const copies=[];
    for(const id in remote.notesP){const r=remote.notesP[id],l=db.notesP[id];if(!l||!r||l[0].del||r[0].del)continue;
      if((l[0].body||'')===(r[0].body||''))continue;if(l[1]>since&&r[1]>since)copies.push({lose:l[1]>r[1]?r:l,by:l[1]>r[1]?(remote.by||'다른 기기'):cfg.device})}
    const merged=merge(db.tasks,remote.tasks), colors=mergeColors(db.colors,remote.colors), notes=mergeColors(db.notes,remote.notes);
    const ui=(remote.uiT||0)>db.uiT?{...UID,...remote.ui}:db.ui, uiT=Math.max(remote.uiT||0,db.uiT);
    const notesP=mergeColors(db.notesP,remote.notesP), events=mergeColors(db.events,remote.events), wprog=mergeColors(db.wprog,remote.wprog), wfixT=(remote.wfixT[1]||0)>(db.wfixT[1]||0)?remote.wfixT:db.wfixT;
    for(const c of copies){const ls=(c.lose[0].body||'').split('\n');ls[0]=`${(ls[0]||'제목 없음').replace(/^#+\s*/,'')} (충돌 사본 · ${c.by})`;notesP[uid()]=[{...c.lose[0],body:ls.join('\n'),pin:false},now()]}
    const devices=mergeColors(db.devices,remote.devices);
    const sigM=(t,c,n,u,ut,wf,wp,ev,dv)=>JSON.stringify([[...t].sort((p,q)=>p.id<q.id?-1:1),kv2(c),kv2(n),u?kv2(u):null,ut,wf,kv2(wp),kv2(ev),kv2(dv)]);
    let mainNew=sigM(merged,colors,notes,ui,uiT,wfixT,wprog,events,devices)!==sigM(remote.tasks.map(norm),remote.colors,remote.notes,remote.ui,remote.uiT||0,remote.wfixT,remote.wprog,remote.events,remote.devices);
    const notesNew=JSON.stringify(kv2(notesP))!==JSON.stringify(kv2(remote.notesP))||(!remote.hasN&&Object.keys(notesP).length>0);
    if(mainNew||notesNew||!(devices[cfg.device]&&devices[cfg.device][1]>now()-6*36e5)){devices[cfg.device]=[now(),now()];mainNew=true}
    if(sigM(merged,colors,notes,ui,uiT,wfixT,wprog,events,devices)+JSON.stringify(kv2(notesP))!==sigM(db.tasks,db.colors,db.notes,db.ui,db.uiT,db.wfixT,db.wprog,db.events,db.devices)+JSON.stringify(kv2(db.notesP))&&!drag){
      Object.assign(db,{tasks:merged,colors,notes,ui,uiT,wfixT,wprog,events,notesP,devices});save(KEY,db);render()}
    if(remote.by)cfg.lastBy=`${remote.by} · ${fmtTs(remote.at||0)}`;
    const files={}, at=now();
    if(mainNew)files[GFILE]={content:JSON.stringify({tasks:merged,colors,notes,ui,uiT,wfixT,wprog,events,devices,by:cfg.device,at},null,1)};
    if(notesNew)files[NFILE]={content:JSON.stringify({notesP},null,1)};
    if(Object.keys(files).length){const pr=await ghx('PATCH',`/gists/${cfg.gist}`,{files});cfg.etag=pr.etag||'';cfg.lastBy=`${cfg.device} · ${fmtTs(at)}`}
    const mo={tasks:merged,colors,notes,ui,uiT,wfixT,wprog,events};cfg.sigM=h32(sigMainOf(mo));cfg.sigN=h32(sigNotesOf({notesP}));
    if(drag)cfg.etag='';
    if(conf.length){const FL={text:'내용',done:'완료',memo:'메모',cat:'분류',date:'날짜',time:'시간',repeat:'반복',star:'중요',deleted:'삭제',state:'상태',end:'종료일',tend:'종료 시간',place:'장소',spawned:'반복',gone:'휴지통',note:'노트'};
      const c=conf[0],msg=conf.length===1?`충돌 · ‘${c.t.text.split('\n')[0].slice(0,14)}’ ${FL[c.f]||c.f} · ${c.vs}·${c.by} 동시 수정 → ${c.by} 기준으로 맞춤`:`충돌 ${conf.length}건 · 나중에 고친 쪽 기준으로 맞춤`;
      notice(msg);cfg.lastConflict=`${fmtTs(now())} · ${msg}`}
    if(copies.length){const msg=`노트 동시 수정 ${copies.length}건 · 다른 쪽 내용을 충돌 사본으로 남겼어요`;notice(msg,'노트 보기',()=>{view='notes';cfg.noteOpen='';render()});cfg.lastConflict=`${fmtTs(now())} · ${msg}`}
    syncOk();
  }catch(e){
    const net=e.message==='Failed to fetch'||e.message==='Load failed'||e.name==='TypeError'||(e.status>=500);
    lastErr=net?'오프라인':e.message;setStatus('err',lastErr);
    if(net&&cfg.syncInt!=='0'){const w=[3e4,12e4,3e5][Math.min(retryN,2)];retryN++;retryT=setTimeout(sync,w)}
    if((e.status===401||e.status===403)&&!tokWarned){tokWarned=true;notice(e.status===401?'Gist 토큰이 만료됐거나 잘못됐어요':'토큰에 gist 권한이 없어요','설정 열기',openSyncSettings)}
  }
  syncing=false;if(again){again=false;queueSync()}
}
function fillCfg(){$('#gToken').value=cfg.token;$('#gId').value=cfg.gist||''}
$('#gSave').onclick=()=>{
  cfg.token=$('#gToken').value.trim();
  cfg.gist=$('#gId').value.trim().replace(/^.*gist\.github\.com\/(?:[^/]+\/)?/,'').replace(/[/#?].*$/,'');cfg.etag='';cfg.sigM='';cfg.sigN='';
  save(CFG,cfg);fillCfg();sync();
};
$('#gNow').onclick=()=>sync();
$('#gOff').onclick=()=>{if(confirm('동기화 설정을 이 기기에서 삭제할까요? (할 일 데이터는 유지됩니다)')){cfg.token='';cfg.gist='';save(CFG,cfg);fillCfg();setStatus('','LOCAL')}};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){render();if(cfg.syncInt!=='0'&&(dirty||now()-(cfg.last||0)>20000))sync()}});
let lastAuto=now();setInterval(()=>{const m=+(cfg.syncInt??1);if(!m||document.visibilityState!=='visible'||!ready())return;if(now()-lastAuto>=m*6e4){lastAuto=now();sync()}},15000);


/* ---------- sync info / history (82, 68) ---------- */
function syncInfo(){
  const st=!ready()?'로컬 전용':cfg.syncInt==='0'&&dirty?'업로드 대기 (수동)':syncing?'동기화 중':lastErr?'오류':dirty?'업로드 대기':'최신 상태';
  const row=(k,v)=>`<div class="pr"><span>${k}</span><b>${v}</b></div>`;
  return row('상태',st)+row('마지막 동기화',cfg.last?fmtTs(cfg.last):'—')+row('마지막 업로드',esc(cfg.lastBy||'—'))+(lastErr?row('오류',esc(lastErr)):'')+(cfg.lastConflict?row('마지막 충돌',esc(cfg.lastConflict)):'')+row('이 기기',esc(cfg.device))+row('Gist',cfg.gist?esc(cfg.gist.slice(0,10))+'…':'—')+row('API 남은 호출',apiLeft?`${apiLeft} / 시간당 5000`:'—')+(ready()?'<button class="btn pri" id="pvSync">지금 동기화</button>':'');
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
  for(const k in (o.notesP||{}))db.notesP[k]=[o.notesP[k][0],ts];
  commit();toast();
}
