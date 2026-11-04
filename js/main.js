/* ---------- init ---------- */
view=cfg.start==='last'?(['list','week','focus'].includes(cfg.lastView)?cfg.lastView:'list'):(cfg.start||'list');
fillCfg();render();applyFont();sync();
let curDay=todayS();
setInterval(()=>{if(todayS()!==curDay){curDay=todayS();weekOff=0;render()}},30000);
if('serviceWorker' in navigator&&location.protocol==='https:'){
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{r.update();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')r.update()})});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had)location.reload()});
}
