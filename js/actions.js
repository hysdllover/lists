/* ---------- actions ---------- */
function addTask(raw,date,time,extra={}){
  let text=raw.trim(), cat='';
  const m=text.match(/(?:^|\s)#(\S+)/); if(m){cat=m[1];text=text.replace(m[0],'').trim()}
  if(!text)return;
  const t=now();
  db.tasks.push({id:uid(),text,done:false,memo:'',cat,date:date||'',time:time||'',...extra,created:t,updated:t,by:cfg.device});
  commit();
}
function onAction(e){
  if(e.target.closest('a'))return;
  const el=e.target.closest('[data-a]'); if(!el)return;
  const row=el.closest('[data-id]'); const t=row&&find(row.dataset.id); if(!t)return;
  if(el.dataset.a==='chk'&&e.type==='click')toggleDone(t);
  else if(el.dataset.a==='star'&&e.type==='click')touch(t,{star:!t.star});
  else if(el.dataset.a==='edit'&&e.type==='click'){if(row.closest('.plan'))quickDay(row,t);else openEdit(t.id)}
  else if(el.dataset.a==='date'&&e.type==='change'){snap('날짜 변경됨');const p={date:el.value||''};if(t.end&&t.date&&p.date)p.end=addDays(p.date,dayDiff(t.date,t.end));if(!p.date)p.end=undefined;touch(t,p);toast()}
  else if(el.dataset.a==='pickdate'&&e.type==='click')openDate(el,t.date,v=>{snap('날짜 변경됨');const p={date:v||''};if(t.end&&t.date&&p.date)p.end=addDays(p.date,dayDiff(t.date,t.end));if(!p.date)p.end=undefined;touch(t,p);toast()});
  else if(el.dataset.a==='note'&&e.type==='click'&&t.note)openNote(t.note);
  else if(el.dataset.a==='restore'&&e.type==='click'){snap('복원됨');touch(t,{deleted:undefined,gone:undefined});toast()}
}
['click','change'].forEach(ev=>['#vList','#vWeek','#vMonth','#vFocus'].forEach(v=>$(v).addEventListener(ev,onAction)));
document.addEventListener('click',e=>{const i=e.target.closest('.ico input[type=date],.ico input[type=time]');if(i&&i.showPicker){try{i.showPicker()}catch{}}},true);

const grow=el=>{el.style.height='auto';el.style.height=el.scrollHeight+'px'};
document.addEventListener('input',e=>{if(e.target.matches('textarea'))grow(e.target)});
function submitAdd(){const a=$('#addTxt');if(!a.value.trim())return;addTask(a.value,addDate,addTime);a.value='';grow(a);setAdd('','')}
$('#addBtn').addEventListener('click',submitAdd);
$('#addTxt').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&!e.isComposing){e.preventDefault();submitAdd()}});
function setAdd(d,t){addDate=d;addTime=t;$('#addPend').textContent=when({date:d,time:t});$('#addIco').classList.toggle('has',!!d);$('#addTIco').classList.toggle('has',!!t)}
$('#addIco').onclick=e=>openDate(e.currentTarget,addDate,v=>setAdd(v,addTime));
$('#addTIco').onclick=e=>openTime(e.currentTarget,addTime,'',r=>setAdd(addDate,r.start));
$('#addPend').addEventListener('click',()=>setAdd('',''));
function submitDay(d){const i=$(`.dayadd[data-d="${d}"]`);if(!i||!i.value.trim())return;const v=i.value;i.value='';forceWeek=true;addTask(v,d);const n=$(`.dayadd[data-d="${d}"]`);n&&n.focus()}
['#days','#plan'].forEach(s=>{$(s).addEventListener('click',e=>{const b=e.target.closest('.dbtn');if(b)submitDay(b.dataset.d)});
$(s).addEventListener('keydown',e=>{const i=e.target.closest('.dayadd');if(i&&e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&!e.isComposing){e.preventDefault();submitDay(i.dataset.d)}})});
$('#vSet').addEventListener('click',e=>{
  const b=e.target.closest('.seg[data-k] button');if(b){setUI(b.parentElement.dataset.k,b.dataset.v);if(b.parentElement.dataset.k==='snd')tick();return}
  const mv=e.target.closest('[data-tmv]');if(mv){const o=tabOrder(),i=o.indexOf(mv.dataset.tmv),j=i+(+mv.dataset.dir);if(j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];setUI('tabOrder',o.join(','));return}
  const ehb=e.target.closest('[data-eh]');if(ehb){let h=(U('eHide')||'').split(',').filter(Boolean).filter(x=>x!==ehb.dataset.eh);if(ehb.dataset.h==='1')h.push(ehb.dataset.eh);setUI('eHide',h.join(','),false);return}
  const th=e.target.closest('[data-thd]');if(th){const k=th.dataset.thd;let h=tabHidden().filter(x=>x!==k);if(th.dataset.h==='1')h.push(k);if(h.length>=Object.keys(TABN).length){notice('탭은 최소 1개 보여야 해요');return}setUI('tabHide',h.join(','))}
});
$('#appName').addEventListener('change',e=>setUI('appName',e.target.value.trim()||'WEEKLY'));
document.addEventListener('change',e=>{if(e.target.classList.contains('accC')){db.ui.accentC=e.target.value;setUI('accent','custom')}});
document.addEventListener('input',e=>{if(e.target.classList.contains('accC')){db.ui.accentC=e.target.value;db.ui.accent='custom';applyUI()}});
$$('input[data-k]').forEach(i=>{i.addEventListener('input',()=>{db.ui[i.dataset.k]=i.value;applyUI();paintSet()});i.addEventListener('change',()=>setUI(i.dataset.k,i.value,false))});
$('#holX').addEventListener('change',e=>setUI('holX',e.target.value));
mq.addEventListener&&mq.addEventListener('change',()=>render());
document.addEventListener('focusout',e=>{if(isDayAdd(e.target))setTimeout(()=>{if(weekDirty&&!isDayAdd(document.activeElement)&&!drag)renderWeek()},300)});
let noteT=null;
$('#wNote').addEventListener('input',e=>{const n=e.target,w=n.dataset.w;clearTimeout(noteT);noteT=setTimeout(()=>{db.notes[w]=[n.value,now()];save(KEY,db);queueSync()},500)});
function submitFocus(){const a=$('#fAdd');if(!a.value.trim())return;addTask(a.value,dayMode||todayS(),'');a.value='';grow(a)}
$('#fBtn').onclick=submitFocus;
$('#fAdd').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&!e.isComposing){e.preventDefault();submitFocus()}});
$('#moreBtn').onclick=e=>showPv(e.currentTarget,'<span class="lbl">Save image</span>'+['long','45','11','wall'].map(r=>`<button class="mi" data-img="${r}">${{long:'전체 길이',45:'세로 4:5',11:'정사각형 1:1',wall:'아이폰 배경화면'}[r]}<small>${{long:'AUTO',45:'1080×1350',11:'1080×1080',wall:'9:19.5'}[r]}</small></button>`).join('')+'<span class="lbl mh">Print</span><button class="mi" data-act="print">A4 인쇄<small>PDF</small></button><span class="lbl mh">Show</span>'+[['wNoteShow','주간 메모'],['wfixShow','주간 항목']].map(([k,l])=>`<button class="mi" data-tg="${k}">${l}<small>${on(k)?'ON':'OFF'}</small></button>`).join('')+`<button class="mi" data-tg="planPos">No date 위치<small>${U('planPos')==='top'?'위':'아래'}</small></button>`);
document.addEventListener('click',e=>{const b=e.target.closest('#pv [data-tg]');if(!b)return;const k=b.dataset.tg;setUI(k,k==='planPos'?(U(k)==='top'?'bottom':'top'):(on(k)?'0':'1'));forceWeek=true;render();hidePv()});
$('#sort').addEventListener('click',e=>{const b=e.target.closest('button');if(b){cfg.sort=b.dataset.s;save(CFG,cfg);render()}});
$$('nav button').forEach(b=>b.addEventListener('click',()=>{dayMode=null;view=b.dataset.v;cfg.lastView=view;save(CFG,cfg);render();scrollTo(0,0)}));
$('#prev').onclick=()=>{weekOff--;render()};$('#next').onclick=()=>{weekOff++;render()};$('#today').onclick=()=>{weekOff=0;render()};
$('#setBtn').onclick=()=>{view='set';render();scrollTo(0,0)};
addEventListener('beforeprint',renderPrint);
let wasSplit=isSplit();addEventListener('resize',()=>{if(isSplit()!==wasSplit){wasSplit=isSplit();render()}else navOn()});
$('#fsr').addEventListener('input',e=>{cfg.fs=+e.target.value;applyUI();$('#fsv').textContent=cfg.fs+'PX'});
$('#fsr').addEventListener('change',()=>save(CFG,cfg));
$('#splitSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(b){cfg.split=+b.dataset.x;save(CFG,cfg);render()}});

/* ---------- drag (long-press) ---------- */
let drag=null, pend=null, noClick=false;
const ROW='.item[data-id]:not(.tr),.wi[data-id]';
document.addEventListener('pointerdown',e=>{
  const row=e.target.closest(ROW);
  if(!row||e.target.closest('button,input,label,textarea,a')||(e.pointerType==='mouse'&&e.button!==0))return;
  pend={row,x:e.clientX,y:e.clientY,mouse:e.pointerType==='mouse'};
  if(!pend.mouse)pend.timer=setTimeout(()=>startDrag(pend.x,pend.y),380);
});
document.addEventListener('pointermove',e=>{
  if(drag){moveDrag(e.clientX,e.clientY);return}
  if(!pend)return;
  const d=Math.hypot(e.clientX-pend.x,e.clientY-pend.y);
  if(pend.mouse&&d>6)startDrag(e.clientX,e.clientY);
  else if(!pend.mouse&&d>8){clearTimeout(pend.timer);pend=null}
});
const stopPend=()=>{if(pend){clearTimeout(pend.timer);pend=null}};
document.addEventListener('pointerup',e=>{stopPend();if(drag)endDrag()});
document.addEventListener('pointercancel',()=>{stopPend();if(drag)endDrag(true)});
document.addEventListener('touchmove',e=>{if(drag)e.preventDefault()},{passive:false});
document.addEventListener('click',e=>{if(noClick){e.stopPropagation();e.preventDefault();noClick=false}},true);
document.addEventListener('contextmenu',e=>{if(drag||pend)e.preventDefault()});
function startDrag(x,y){
  const row=pend.row;pend=null;if(!row.isConnected)return;
  const r=row.getBoundingClientRect(), g=row.cloneNode(true);
  g.classList.add('ghost');g.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px`;
  document.body.appendChild(g);row.classList.add('dragging');document.body.classList.add('drag');
  drag={id:row.dataset.id,row,g,x0:x,y0:y,target:null};
  if(navigator.vibrate)navigator.vibrate(8);
}
function clearMarks(){$$('.drop,.drop-before,.drop-after').forEach(el=>el.classList.remove('drop','drop-before','drop-after'))}
function moveDrag(x,y){
  drag.g.style.transform=`translate(${x-drag.x0}px,${y-drag.y0}px)`;
  if(y<70)scrollBy(0,-10);else if(y>innerHeight-90)scrollBy(0,10);
  clearMarks();drag.target=null;
  const el=document.elementFromPoint(x,y);if(!el)return;
  const w=el.closest('.day .wi');let day=el.closest('.day,.plan,.mc');const it=el.closest('#open .item');
  if(!day){const mr=el.closest('.mrin');if(mr){const r=mr.getBoundingClientRect();day=mr.querySelectorAll('.mc')[Math.max(0,Math.min(6,Math.floor((x-r.left)/(r.width/7))))]}}
  if(w&&w.dataset.id!==drag.id){const r=w.getBoundingClientRect(),after=y>r.top+r.height/2;w.classList.add(after?'drop-after':'drop-before');drag.target={day:w.closest('.day').dataset.d,rel:{id:w.dataset.id,after}}}
  else if(day){day.classList.add('drop');drag.target={day:day.dataset.d}}
  else if(it&&cfg.sort==='manual'&&drag.row.closest('#open')&&it.dataset.id!==drag.id){
    const r=it.getBoundingClientRect(),after=y>r.top+r.height/2;
    it.classList.add(after?'drop-after':'drop-before');drag.target={id:it.dataset.id,after}}
}
function endDrag(cancel){
  const d=drag;drag=null;d.g.remove();d.row.classList.remove('dragging');document.body.classList.remove('drag');clearMarks();
  noClick=true;setTimeout(()=>noClick=false,350);
  const t=find(d.id);if(cancel||!t||!d.target)return;
  if(d.target.day!==undefined){
    const nd=d.target.day, p={}, ts=now();
    if((t.date||'')!==nd){p.date=nd;if(t.end&&t.date&&nd)p.end=addDays(nd,dayDiff(t.date,t.end));if(!nd)p.end=undefined}
    if(!Object.keys(p).length&&!d.target.rel)return;
    snap(d.target.rel&&!p.date?'순서 변경됨':nd?'이동됨':'날짜 해제됨');
    if(Object.keys(p).length)setF(t,p,ts);
    if(d.target.rel){const box=$(`.day[data-d="${nd}"] .dl`);const ids=[...box.querySelectorAll('.wi[data-id]')].map(e=>e.dataset.id).filter(i=>i!==d.id);
      ids.splice(ids.indexOf(d.target.rel.id)+(d.target.rel.after?1:0),0,d.id);ids.forEach((id,i)=>{const x=find(id);if(x&&x.dord!==i)setF(x,{dord:i},ts)})}
    commit();toast();return}
  const ids=$$('#open .item').map(el=>el.dataset.id).filter(i=>i!==d.id);
  ids.splice(ids.indexOf(d.target.id)+(d.target.after?1:0),0,d.id);
  snap('순서 변경됨');const ts=now();ids.forEach((id,i)=>{const x=find(id);if(x&&x.order!==i)setF(x,{order:i},ts)});commit();toast();
}

/* ---------- editor ---------- */
function openEdit(id){
  const t=find(id); editId=id;
  $('#eTxt').value=t.text;$('#eMemo').value=t.memo||'';$('#eCat').value=t.cat||'';$('#ePlace').value=t.place||'';paintCats();$('#eInfo').textContent=`LAST EDIT · ${t.by||'—'} · ${fmtTs(t.updated||t.created)}`;setDP($('#eDate'),t.date);setTP($('#eTime'),t.time);setDP($('#eEnd'),t.end);setTP($('#eTend'),t.tend);eNoteV=t.note||'';paintENote();eState=t.state||'';
  eRep=t.repeat||'';eStar=!!t.star;paintEdit();eProg=t.prog?String(t.prog):'';paintProg();
  {const hid=(U('eHide')||'').split(','),has={prog:t.prog,memo:t.memo,cat:t.cat,end:t.end,time:t.time,repeat:t.repeat,state:t.state,place:t.place,note:t.note};
   $$('#sheet [data-ef]').forEach(r=>{r.hidden=hid.includes(r.dataset.ef)&&!has[r.dataset.ef]});
   $$('#sheet .eg').forEach(g=>{g.hidden=$$(`#sheet [data-g="${g.dataset.eg}"]`).every(r=>r.hidden)})}
  $('#back').classList.add('on');requestAnimationFrame(()=>grow($('#eTxt')));
}
function closeEdit(){
  const t=find(editId); editId=null; $('#back').classList.remove('on');
  if(!t)return;
  const p={text:$('#eTxt').value.trim()||t.text,memo:$('#eMemo').value,cat:$('#eCat').value.trim(),date:getV('#eDate'),time:getV('#eTime'),repeat:eRep||undefined,star:eStar||undefined,state:eState||undefined,prog:eProg&&eProg!=='100'?+eProg:undefined,place:$('#ePlace').value.trim()||undefined,note:noteGet(eNoteV)?eNoteV:undefined};
  const en=getV('#eEnd');p.end=en&&p.date&&en>p.date?en:undefined;const te=getV('#eTend');p.tend=te&&p.time&&te>p.time?te:undefined;
  if(p.repeat&&!p.date)p.date=todayS();
  if(eProg==='100'&&!t.done){closeAndDone=true}
  const nv=v=>v===false||v===undefined||v===''?'':JSON.stringify(v);
  if(!Object.keys(p).some(k=>nv(p[k])!==nv(t[k]))&&!closeAndDone)return;
  snap(p.date!==(t.date||'')&&t.date?'날짜 변경됨':'수정됨');touch(t,p);toast();
  if(closeAndDone){closeAndDone=false;toggleDone(t)}
}
$('#eClose').onclick=closeEdit;
$('#back').addEventListener('click',e=>{if(e.target.id==='back')closeEdit()});
let eState='';
$('#eState').addEventListener('click',e=>{const b=e.target.closest('button');if(b){eState=b.dataset.s;paintEdit()}});
function paintEdit(){$$('#eState button').forEach(b=>b.classList.toggle('on',b.dataset.s===eState));$$('#eRep button').forEach(b=>b.classList.toggle('on',b.dataset.r===eRep));$('#eStar').classList.toggle('on',eStar)}
$('#eRep').addEventListener('click',e=>{const b=e.target.closest('button');if(b){eRep=b.dataset.r;paintEdit()}});
$('#eStar').onclick=()=>{eStar=!eStar;paintEdit()};
let eProg='';$('#eProg').addEventListener('click',e=>{const b=e.target.closest('button');if(b){eProg=b.dataset.p;paintProg()}});
function paintProg(){$$('#eProg button').forEach(b=>b.classList.toggle('on',b.dataset.p===String(eProg)))}
$('#eNoDate').onclick=()=>{setDP($('#eDate'),'');setDP($('#eEnd'),'')};$('#eNoTime').onclick=()=>{setTP($('#eTime'),'');setTP($('#eTend'),'')};$('#eNoEnd').onclick=()=>{setDP($('#eEnd'),'')};
$('#eDel').onclick=()=>{const t=find(editId);editId=null;$('#back').classList.remove('on');if(t)collapse($$(`[data-id="${t.id}"]`),()=>{snap('삭제됨');touch(t,{deleted:true});toast()})};
$('#undoBtn').onclick=()=>{if(noticeFn){const f=noticeFn;noticeFn=null;$('#toast').classList.remove('on');f()}else undo()};
$('#catList').addEventListener('click',e=>{const b=e.target.closest('button[data-c]');if(b){db.colors[b.dataset.c]=[+b.dataset.i,now()];commit()}});


/* ---------- v11 interactions ---------- */
function paintCats(){
  const cats=[...new Set(live().map(t=>t.cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko')), v=$('#eCat').value.trim();
  $('#eCats').innerHTML=cats.map(c=>`<button class="cchip${c===v?' on':''}" data-c="${esc(c)}" style="--ul:${catColor(c)}">${esc(c)}</button>`).join('');
}
$('#eCats').addEventListener('click',e=>{const b=e.target.closest('.cchip');if(!b)return;const e2=$('#eCat');e2.value=e2.value.trim()===b.dataset.c?'':b.dataset.c;paintCats()});
$('#eCat').addEventListener('input',paintCats);
// group fold (91)
$('#open').addEventListener('click',e=>{const g=e.target.closest('.grp[data-g]');if(!g)return;cfg.gfold=cfg.gfold||{};cfg.gfold[g.dataset.g]=!cfg.gfold[g.dataset.g];save(CFG,cfg);renderList()});
// settings sections / local segs (A, 86)
$('#vSet').addEventListener('click',e=>{
  const sh=e.target.closest('.sh');if(sh){const k=sh.parentElement.dataset.sec;cfg.secs=cfg.secs||{};cfg.secs[k]=cfg.secs[k]===false;save(CFG,cfg);paintSet();return}
  const b=e.target.closest('.seg[data-c] button');if(b){cfg[b.parentElement.dataset.c]=b.dataset.v;save(CFG,cfg);render()}
});
$('#gDev').addEventListener('change',e=>{cfg.device=e.target.value.trim()||'Device';save(CFG,cfg)});
// weekly fixed (90)
$('#wfix').addEventListener('click',e=>{
  const row=e.target.closest('.fx');if(!row)return;const id=row.dataset.fx, wk=ymd(weekStart(weekOff));
  const b=e.target.closest('.fxb button');
  if(b){const k=wk+':'+id,c=(db.wprog[k]||[0])[0],n=+b.dataset.n;db.wprog[k]=[n===c?n-1:n,now()];if(n>c)tick();save(KEY,db);renderFix();queueSync();return}
  if(e.target.closest('.fxd')){const it=db.wfixT[0].find(x=>x.id===id);if(it&&confirm(`"${it.text}" 주간 항목을 삭제할까요?`)){db.wfixT=[db.wfixT[0].filter(x=>x.id!==id),now()];save(KEY,db);renderFix();queueSync()}}
});
$('#wfix').addEventListener('keydown',e=>{
  const i=e.target.closest('#fxAdd');if(!i||e.key!=='Enter'||e.isComposing)return;e.preventDefault();
  const m=i.value.trim().match(/^(.*?)\s*(\d+)\s*(회|번|x)?$/i), text=(m?m[1]:i.value).trim(), goal=Math.min(14,Math.max(1,m?+m[2]:1));if(!text)return;
  db.wfixT=[[...db.wfixT[0],{id:uid(),text,goal}],now()];save(KEY,db);i.value='';renderFix();$('#fxAdd').focus();queueSync();
});
// popover (82, 99)
function showPv(anchor,html){
  const p=$('#pv');p.innerHTML=html;p.hidden=false;const r=anchor.getBoundingClientRect(),w=p.offsetWidth;
  p.style.top=(r.bottom+8)+'px';p.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w))+'px';
}
const hidePv=()=>{$('#pv').hidden=true};
let pvHold=0;
document.addEventListener('click',e=>{if(now()-pvHold<700)return;if(!$('#pv').hidden&&!e.target.closest('#pv')&&!e.target.closest('#sync,#moreBtn,#mMore,.dchip,#pk,#eNote,.dp,.tp'))hidePv()},true);
$('#pv').addEventListener('click',e=>{
  const m=e.target.closest('[data-img]');if(m){hidePv();weekImage(m.dataset.img);return}
  if(e.target.closest('[data-act=print]')){hidePv();printMode='week';renderPrint();print();return}
  if(e.target.closest('[data-act=mprint]')){hidePv();printMode='month';renderPrint();print();printMode='week';return}
  if(e.target.closest('[data-act=mimg]')){hidePv();monthImage();return}
  const mb=e.target.closest('#evMode button');if(mb){$$('#evMode button').forEach(b=>b.classList.toggle('on',b===mb));return}
  if(e.target.closest('#evSave')){const f=$('.evf'),name=$('#evName').value.trim(),date=getV('#evDate'),mode=($('#evMode .on')||{}).dataset?.m||'once';
    if(!name||!date){$('#evName').focus();return}
    db.events[f.dataset.id||uid()]=[{name,date,mode},now()];save(KEY,db);hidePv();render();queueSync();return}
  if(e.target.closest('#evDel')){const id=$('.evf').dataset.id,ev=db.events[id];if(ev&&confirm(`"${ev[0].name}" D-day를 삭제할까요?`)){db.events[id]=[{...ev[0],del:1},now()];save(KEY,db);hidePv();render();queueSync()}return}
  if(e.target.closest('#pvSync')){hidePv();sync()}
});
$('#sync').addEventListener('click',e=>showPv(e.currentTarget,syncInfo()));
// pinch zoom (78)
function setWz(v,sv){cfg.wz=Math.min(1.6,Math.max(.7,Math.round(v*100)/100));applyUI();if(sv)save(CFG,cfg)}
let gz=null;const dEl=$('#days');
dEl.addEventListener('gesturestart',e=>{if(innerWidth<768)return;e.preventDefault();gz=cfg.wz||1});
dEl.addEventListener('gesturechange',e=>{if(gz===null)return;e.preventDefault();setWz(gz*e.scale,false)});
dEl.addEventListener('gestureend',()=>{if(gz===null)return;gz=null;save(CFG,cfg)});
dEl.addEventListener('wheel',e=>{if(!e.ctrlKey||innerWidth<768)return;e.preventDefault();setWz((cfg.wz||1)*(1-e.deltaY*.01),true)},{passive:false});
$('#wzBtn').onclick=()=>setWz(1,true);

/* ---------- D-day form ---------- */
function evForm(id){
  const e=id&&db.events[id]?db.events[id][0]:{name:'',date:todayS(),mode:'once'};
  return `<div class="evf" data-id="${id||''}"><span class="lbl">${id?'Edit D-Day':'New D-Day'}</span>
    <input id="evName" placeholder="이름  예) 시험, 여행, 만난 날" value="${esc(e.name)}" autocomplete="off">
    <button class="dp evd has" id="evDate" data-v="${e.date}">${fmtD(e.date)}</button>
    <div class="seg" id="evMode">${[['once','남은 날 D-'],['yearly','매년 반복'],['since','지난 날 일째']].map(([m,l])=>`<button data-m="${m}" class="${m===e.mode?'on':''}">${l}</button>`).join('')}</div>
    <p class="note">지난 날 모드는 시작일을 1일째로 세고, 100일마다 주간 보기에 표시합니다.</p>
    <div class="row">${id?'<button class="tbtn del" id="evDel">삭제</button>':'<span></span>'}<button class="btn pri sm" id="evSave">저장</button></div></div>`;
}
document.addEventListener('click',e=>{const c=e.target.closest('.dchip');if(!c)return;if(c.dataset.past){cfg.ddPast=!cfg.ddPast;save(CFG,cfg);render();return}showPv(c,evForm(c.dataset.ev));if(!c.dataset.ev)setTimeout(()=>$('#evName')&&$('#evName').focus(),50)});
/* ---------- swipe to reveal (C10) ---------- */
let sw=null;
document.addEventListener('pointerdown',e=>{
  $$('.item.open').forEach(x=>{if(!x.contains(e.target))x.classList.remove('open')});
  const it=e.target.closest('.item');if(!it||e.pointerType==='mouse')return;sw={it,x:e.clientX,y:e.clientY,on:false};
},true);
document.addEventListener('pointermove',e=>{if(!sw||drag)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;if(!sw.on&&Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.6){sw.on=true;stopPend()}},true);
document.addEventListener('pointerup',e=>{if(!sw)return;const dx=e.clientX-sw.x;
  if(sw.on){noClick=true;setTimeout(()=>noClick=false,300);if(dx<-24)sw.it.classList.add('open');else if(dx>24)sw.it.classList.remove('open')}sw=null},true);
document.addEventListener('pointercancel',()=>{sw=null},true);
/* ---------- wake lock (112) ---------- */
let wl=null;
async function wakeSync(){
  const want=!!cfg.wake&&view==='focus'&&document.visibilityState==='visible';
  try{if(want&&!wl&&'wakeLock' in navigator){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null})}
      else if(!want&&wl){const w=wl;wl=null;await w.release()}}catch{}
}
$('#wakeBtn').hidden=!('wakeLock' in navigator);
$('#wakeBtn').onclick=()=>{cfg.wake=!cfg.wake;save(CFG,cfg);$('#wakeBtn').classList.toggle('on',cfg.wake);wakeSync()};
document.addEventListener('visibilitychange',wakeSync);

/* ---------- bin tabs / trash (K2, K15) ---------- */
$('#binTabs').addEventListener('click',e=>{const b=e.target.closest('[data-b]');if(!b)return;cfg.bin=cfg.bin===b.dataset.b?'':b.dataset.b;save(CFG,cfg);renderList()});
$('#binAct').addEventListener('click',e=>{if(e.target.id!=='emptyTrash')return;const tr=db.tasks.filter(t=>t.deleted&&!t.gone);
  if(tr.length&&confirm(`휴지통의 ${tr.length}개 항목을 비울까요? 되돌릴 수 없어요.`)){const ts=now();tr.forEach(t=>setF(t,{gone:true},ts));commit()}});
/* ---------- long-press checkbox = in progress (K13) ---------- */
let lpT=null;
document.addEventListener('pointerdown',e=>{const c=e.target.closest('.chk[data-a=chk]');if(!c)return;const row=c.closest('[data-id]');clearTimeout(lpT);
  lpT=setTimeout(()=>{lpT=null;const t=row&&find(row.dataset.id);if(!t||t.done)return;noClick=true;setTimeout(()=>noClick=false,500);
    const d=t.state==='doing';snap(d?'진행 중 해제됨':'진행 중으로 표시됨');touch(t,{state:d?undefined:'doing'});toast()},450)});
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,()=>{clearTimeout(lpT);lpT=null}));
/* ---------- month (K20) ---------- */
$('#mPrev').onclick=()=>{monOff--;mSel=null;renderMonth()};
$('#mNext').onclick=()=>{monOff++;mSel=null;renderMonth()};
$('#mNow').onclick=()=>{monOff=0;mSel=null;renderMonth()};
$('#mGrid').addEventListener('click',e=>{const w=e.target.closest('.mwk');if(w){weekOff=Math.round((parse(w.dataset.w)-weekStart(0))/(7*864e5));view='week';cfg.lastView=view;save(CFG,cfg);render();scrollTo(0,0);return}
  const c=e.target.closest('.mc');if(!c)return;const s=c.dataset.d;
  if(c.classList.contains('out'))monOff+=parse(s)<monthGrid(monOff).first?-1:1;mSel=s;renderMonth();
  if(matchMedia('(max-width:767px)').matches)$('#vMonth').classList.add('mopen')});
$('#mpClose').onclick=()=>$('#vMonth').classList.remove('mopen');
document.addEventListener('click',e=>{const v=$('#vMonth');if(!v.classList.contains('mopen')||e.target.closest('.mpanel,.mc,.back,#pv,#pk,.sheet'))return;v.classList.remove('mopen')});
document.addEventListener('click',e=>{const g=e.target.closest('.dgrp');if(!g)return;wExp=g.dataset.wk;forceWeek=true;renderWeek()});
function submitMonth(){const a=$('#mAdd');if(!a.value.trim())return;addTask(a.value,a.dataset.d,'');a.value='';grow(a)}
$('#mBtn').onclick=submitMonth;
$('#mAdd').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&!e.isComposing){e.preventDefault();submitMonth()}});
$('#mMore').onclick=e=>showPv(e.currentTarget,'<span class="lbl">Month</span><button class="mi" data-act="mimg">이미지 저장<small>PNG</small></button><button class="mi" data-act="mprint">A4 인쇄<small>PDF</small></button>');
/* ---------- shortcut URL copy (K16) ---------- */
$('#scCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('#scUrl').textContent);$('#scCopy').textContent='복사됨'}catch{$('#scCopy').textContent='길게 눌러 복사'}setTimeout(()=>$('#scCopy').textContent='복사',1500)};

/* ---------- weekly memo preview (4) ---------- */
$('#wNoteV').addEventListener('click',e=>{if(e.target.closest('a'))return;$('.dnote').classList.remove('reading');const n=$('#wNote');n.focus();grow(n)});
$('#wNote').addEventListener('blur',e=>{const v=e.target.value;$('#wNoteV').innerHTML=md(v);$('.dnote').classList.toggle('reading',!!v.trim())});
document.addEventListener('change',e=>{const i=e.target.closest('input[data-cc]');if(i){db.colors[i.dataset.cc]=[i.value,now()];commit()}});

/* ---------- info tab (K11, K12) ---------- */
$('#chkUpd').onclick=async()=>{
  if(!('serviceWorker' in navigator)||location.protocol!=='https:'){notice('웹 주소(https)에서 열었을 때만 확인할 수 있어요');return}
  const r=await navigator.serviceWorker.getRegistration();if(!r){location.reload();return}
  notice('새 버전을 확인하는 중…');try{await r.update()}catch{}
  setTimeout(()=>{if(r.installing||r.waiting)notice('새 버전을 받는 중이에요. 곧 다시 열려요');else notice('최신 버전이에요 · VERSION '+APP_VER)},1500);
};
$('#hardReload').onclick=async()=>{
  if(!confirm('앱 파일만 지우고 다시 받을까요?\n할 일·노트·설정은 그대로예요.'))return;
  await flushDb();
  try{if(window.caches)for(const k of await caches.keys())await caches.delete(k);if(navigator.serviceWorker)for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister()}catch{}
  location.reload();
};
/* ---------- collapsing header (K15) ---------- */
addEventListener('scroll',()=>{const s=scrollY>110;if(s!==document.body.classList.contains('scrolled')){document.body.classList.toggle('scrolled',s);setMini()}},{passive:true});

let closeAndDone=false;
/* ---------- quick day chips for undated tasks (K2) ---------- */
function quickDay(row,t){
  const ds=weekDays(view==='week'?weekOff:0), td=todayS();
  showPv(row,'<span class="lbl">Set a day</span><div class="qd">'+ds.map(d=>{const s=ymd(d);return `<button class="${s===td?'today':''}${d.getDay()===0?' red':''}" data-qd="${s}"><span class="lbl">${U('dow')==='ko'?DOW[d.getDay()]:DOWE[d.getDay()]}</span><b class="num">${pz(d.getDate())}</b></button>`}).join('')+'</div><div class="qdx"><button class="tbtn" data-qd="'+addDays(ymd(ds[0]),7)+'">다음 주</button><button class="tbtn" data-qpick="1">날짜 선택</button><button class="tbtn" data-qdone="1">완료</button><button class="tbtn" data-qedit="1">편집</button></div>');
  quickT=t;
}
let quickT=null;
$('#pv').addEventListener('click',e=>{
  if(!quickT)return;const t=quickT;
  const d=e.target.closest('[data-qd]');if(d){hidePv();quickT=null;snap('날짜 지정됨');touch(t,{date:d.dataset.qd});toast();return}
  if(e.target.closest('[data-qedit]')){hidePv();quickT=null;openEdit(t.id);return}
  if(e.target.closest('[data-qdone]')){hidePv();quickT=null;snap('완료됨');touch(t,{done:true});toast();return}
  const pk2=e.target.closest('[data-qpick]');if(pk2){const anchor=pk2;openDate(anchor,'',v=>{hidePv();quickT=null;if(v){snap('날짜 지정됨');touch(t,{date:v});toast()}})}
});
['#plan','#fPlan'].forEach(s=>{const box=$(s);
  box.addEventListener('click',e=>{
    if(e.target.closest('.planHead')){cfg.planFold=!cfg.planFold;save(CFG,cfg);forceWeek=true;render();return}
    if(e.target.closest('[data-umore]')){cfg.planAll=!cfg.planAll;save(CFG,cfg);forceWeek=true;render()}});
  box.addEventListener('keydown',e=>{const i=e.target.closest('.uadd');if(!i||e.key!=='Enter'||e.isComposing)return;e.preventDefault();const v=i.value.trim();if(!v)return;i.value='';forceWeek=true;addTask(v,'','');const n=$(s+' .uadd');n&&n.focus()})});
/* ---------- day view from week (K4) ---------- */
$('#days').addEventListener('click',e=>{const h=e.target.closest('.dh');if(!h||e.target.closest('[data-note]'))return;dayMode=h.closest('.day').dataset.d;view='focus';render();scrollTo(0,0)});
$('#dPrev').onclick=()=>{dayMode=addDays(dayMode,-1);render()};
$('#dNext').onclick=()=>{dayMode=addDays(dayMode,1);render()};
$('#dBack').onclick=()=>{const d=dayMode;dayMode=null;view='week';weekOff=Math.round((weekStart(0)-parse(d))/-(7*864e5))-(parse(d).getDay()<0?1:0);weekOff=Math.floor((parse(d)-weekStart(0))/(7*864e5));render()};
/* preset (K7) */
$('#vSet').addEventListener('click',e=>{const b=e.target.closest('[data-preset] button');if(!b)return;const k=b.dataset.v,P=PRESET[k];
  if(P){db.ui.accent=P.accent;if(P.accentC)db.ui.accentC=P.accentC}else db.ui.accent='bluegray';setUI('preset',k)});
