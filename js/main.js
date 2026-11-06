/* ---------- init ---------- */
(async()=>{
const hadCfg=localStorage.getItem(CFG)!==null;
try{if(localStorage.getItem(KEY)!==null){await kv('readwrite',s=>s.put(db,'db'));localStorage.removeItem(KEY)}else{const d=await kv('readonly',s=>s.get('db'));if(d){db=d;initDb()}}}catch(e){idbOk=false}
view=cfg.start==='last'?(['list','week','month','focus','notes'].includes(cfg.lastView)?cfg.lastView:'list'):(cfg.start||'list');
(function(){
  const q=new URLSearchParams(location.search);if(![...q.keys()].length)return;
  const VM={list:'list',week:'week',month:'month',today:'focus',focus:'focus',note:'notes',notes:'notes'};if(VM[q.get('view')])view=VM[q.get('view')];
  const dw={'오늘':0,today:0,'내일':1,tomorrow:1,'모레':2};
  const dt=v=>!v?'':(v in dw)?addDays(todayS(),dw[v]):/^\d{4}-\d{2}-\d{2}$/.test(v)?v:'';
  const tm=v=>/^\d{1,2}:\d{2}$/.test(v||'')?v.padStart(5,'0'):'';
  const a=q.get('add');if(a&&a.trim()){snap('단축어로 추가됨');addTask(a,dt(q.get('date')),tm(q.get('time')));toast()}
  const dd=q.get('dday');if(dd&&dt(q.get('date'))){db.events[uid()]=[{name:dd,date:dt(q.get('date')),mode:['once','yearly','since'].includes(q.get('mode'))?q.get('mode'):'once'},now()];save(KEY,db)}
  history.replaceState(null,'',location.pathname);
})();
fillCfg();render();applyFont();if(cfg.syncInt!=='0')sync();else setStatus('',ready()?'MANUAL':'LOCAL');
let curDay=todayS();
setInterval(()=>{if(todayS()!==curDay){curDay=todayS();weekOff=0;render()}},30000);
{const prev=cfg.seenVer||(hadCfg?16:0);if(prev&&prev<APP_VER)notice(`VERSION ${APP_VER} · ${CHANGES[APP_VER].split(' · ').slice(0,3).join(' · ')}`,'자세히',()=>{view='set';cfg.setTab='info';render()});cfg.seenVer=APP_VER;save(CFG,cfg)}
if('serviceWorker' in navigator&&location.protocol==='https:'){
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{r.update();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')r.update()})});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had)location.reload()});
}
})();
