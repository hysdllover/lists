/* ---------- list ---------- */
const CAL='<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="11"/><path d="M2 6.5h12M5 1.5v3M11 1.5v3"/></svg>';
function itemHTML(t){
  const late=t.date&&!t.done&&t.date<todayS();
  return `<li class="item${t.done?' done':''}${t.star&&!t.done?' starred':''}" data-id="${t.id}">
    <button class="chk${t.done?' on':''}" data-a="chk" aria-label="완료"${ccStyle(t)}></button>
    <div class="body" data-a="edit">
      <div class="txt">${txHTML(t)}</div>
      ${t.memo?`<div class="memo">${md(U('memo')==='1'?t.memo:t.memo.split('\n')[0])}</div>`:''}
      ${t.date||t.time||t.repeat||t.done?`<div class="meta">${t.done&&t.u&&t.u.done?`<span class="dn">✓ ${bigD(new Date(t.u.done))}</span>`:''}${t.date||t.time?`<span class="date${late?' late':''}">${when(t)}</span>`:''}${ddHTML(t)}${t.repeat?`<span class="rep">↻ ${REP[t.repeat]}</span>`:''}</div>`:''}
    </div>
    <button class="star${t.star?' on':''}" data-a="star" aria-label="중요">${STAR}</button>
    <label class="ico${t.date?' has':''}">${CAL}<input type="date" data-a="date" value="${t.date||''}"></label>
  </li>`;
}
function sorted(arr){
  const s=cfg.sort, a=[...arr];
  const k=t=>(t.date||'9999')+(t.time||'99:99'), byDate=(x,y)=>k(x)<k(y)?-1:k(x)>k(y)?1:x.created-y.created;
  if(s==='added')a.sort((x,y)=>y.created-x.created);
  else if(s==='cat')a.sort((x,y)=>(x.cat||'￿').localeCompare(y.cat||'￿','ko')||byDate(x,y));
  else if(s==='manual')a.sort((x,y)=>(x.order??x.created)-(y.order??y.created));
  else a.sort(byDate);
  return a;
}
function renderList(){
  const L=live(), pin=sorted(L.filter(t=>!t.done&&t.star)), rest=sorted(L.filter(t=>!t.done&&!t.star)), open=[...pin,...rest], isArch=t=>t.done&&ft(t,'done')<now()-30*864e5, done=sorted(L.filter(t=>t.done&&!isArch(t))), arch=L.filter(isArch).sort((a,b)=>ft(b,'done')-ft(a,'done'));
  let h='', g=null;
  const cat=cfg.sort==='cat', gf=cfg.gfold||{}, cnt={};rest.forEach(t=>cnt[t.cat||'']=(cnt[t.cat||'']||0)+1);
  const gh=(k,l,n)=>`<li class="grp lbl${gf[k]?' closed':''}" data-g="${esc(k)}">${l}<span class="gn">${n}</span><i>›</i></li>`;
  if(pin.length&&cat)h+=gh('★','Starred',pin.length);
  if(!(cat&&gf['★']))h+=pin.map(itemHTML).join('');
  for(const t of rest){
    if(cat&&(t.cat||'')!==g){g=t.cat||'';h+=gh(g,esc(g||'미분류'),cnt[g])}
    if(!(cat&&gf[t.cat||'']))h+=itemHTML(t);
  }
  $('#open').innerHTML=h||'<li class="empty">할 일이 없습니다</li>';
  $('#done').innerHTML=cfg.fold?'':done.map(itemHTML).join('');
  $('#fold').classList.toggle('open',!cfg.fold);
  $('#fold').style.display=done.length?'':'none';
  $('#doneN').textContent=done.length;
  $('#foldA').style.display=arch.length?'':'none';$('#archN').textContent=arch.length;$('#foldA').classList.toggle('open',!!cfg.archOpen);$('#arch').innerHTML=cfg.archOpen?arch.map(itemHTML).join(''):'';
  $('#sOpen').textContent=open.length;$('#sDone').textContent=done.length;
  const n=new Date();$('#lDay').textContent=dowL(n,true);$('#lDate').textContent=bigD(n);
  $$('#sort button').forEach(b=>b.classList.toggle('on',b.dataset.s===cfg.sort));
  const cats=[...new Set(L.map(t=>t.cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  $('#cats').innerHTML=cats.map(c=>`<option value="${esc(c)}">`).join('');
  $('#catList').innerHTML=cats.length?cats.map(c=>`<div class="field"><span>${tagHTML(c)}</span><div class="sw">${[0,1,2,3,4,5,6,7].map(i=>`<button data-c="${esc(c)}" data-i="${i}" class="${catIdx(c)===i?'on':''}" style="background:var(--c${i})" aria-label="색 ${i+1}"></button>`).join('')}</div></div>`).join(''):'<p class="note">분류가 있는 할 일을 추가하면 여기에 표시됩니다.</p>';
  $('#hint').style.visibility=cfg.sort==='manual'?'visible':'hidden';
}

/* ---------- week (Sunday start) ---------- */
function weekStart(off){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay()+off*7);return d}
function weekDays(off){const s=weekStart(off);return[...Array(7)].map((_,i)=>{const d=new Date(s);d.setDate(s.getDate()+i);return d})}
let weekDirty=false, forceWeek=false;
const weekSort=a=>a.sort((x,y)=>(U('doneBottom')==='1'?x.done-y.done:0)||!!y.star-!!x.star||(x.time||'99').localeCompare(y.time||'99')||x.created-y.created);
const wiHTML=t=>`<div class="wi${t.done?' done':''}" data-id="${t.id}"><button class="chk${t.done?' on':''}" data-a="chk"${ccStyle(t)}></button><div class="body" data-a="edit"><span class="txt">${t.star?`<span class="st">${STAR}</span>`:''}${t.time?`<span class="tm">${t.time}</span>`:''}${txHTML(t)}${t.repeat?` <span class="rep">↻</span>`:''}</span></div></div>`;
const isDayAdd=el=>!!(el&&el.classList&&el.classList.contains('dayadd'));
function renderWeek(){
  const ae=document.activeElement;
  if(!forceWeek&&isDayAdd(ae)){weekDirty=true;return}
  forceWeek=false;weekDirty=false;
  const keep={};$$('.dayadd').forEach(i=>{if(i.value)keep[i.dataset.d]=i.value});
  const days=weekDays(weekOff), L=live(), td=todayS(), H=holidays(), a=days[0], b=days[6], st=U('dstyle');
  const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  rangeTxt=`${a.getFullYear()}.${pad(a.getMonth()+1)}.${pad(a.getDate())} – ${pad(b.getMonth()+1)}.${pad(b.getDate())}`;
  $('#wMon').textContent=`${MON[a.getMonth()]}${a.getMonth()!==b.getMonth()?' – '+MON[b.getMonth()]:''} ${b.getFullYear()}${U('weekNo')==='1'?' · W'+pad(isoWeek(a)):''}`;
  $('#rng').textContent=st==='en'?`${MONS[a.getMonth()]} ${a.getDate()} — ${a.getMonth()!==b.getMonth()?MONS[b.getMonth()]+' ':''}${b.getDate()}`:st==='ko'?`${a.getDate()}일 — ${b.getDate()}일`:`${pad(a.getDate())} — ${pad(b.getDate())}`;
  const wk=ymd(a), n=$('#wNote'); n.dataset.w=wk; if(ae!==n){n.value=(db.notes[wk]||[''])[0];grow(n)}
  if(ae!==$('#fxAdd'))renderFix();
  const un=sorted(L.filter(t=>!t.date&&!t.done));
  $('#plan').hidden=!cfg.plan;$('#planBtn').classList.toggle('on',!!cfg.plan);$('#planBtn').textContent='PLAN'+(un.length?' '+un.length:'');
  $('#plan').innerHTML=`<div class="ph"><span class="lbl">Unscheduled · ${un.length}</span><span class="hint lbl">Hold &amp; drag to a day</span></div><div class="pl">${un.map(wiHTML).join('')||'<span class="empty2">날짜 없는 할 일이 없습니다</span>'}</div>`;
  $('#days').innerHTML=days.map(d=>{
    const s=ymd(d), ts=weekSort(L.filter(t=>t.date===s)), h=H[s];
    const cls=['day',s===td&&'today',s<td&&'past',(d.getDay()===0||h)&&'sun',!ts.length&&s!==td&&'empty'].filter(Boolean).join(' ');
    return `<div class="${cls}" data-d="${s}">
      <div class="dh"><span class="lbl">${dowL(d)}</span><span class="d num">${pad(d.getDate())}</span>${h?`<span class="hn">${esc(h)}</span>`:''}<span class="n num">${ts.length?ts.filter(t=>t.done).length+'/'+ts.length:''}</span></div><div class="dl">
      ${ts.map(wiHTML).join('')}
      <div class="dadd"><textarea class="dayadd" rows="1" placeholder="+" data-d="${s}"></textarea><button class="dbtn" data-d="${s}">ADD</button></div>
    </div></div>`}).join('');
  for(const d in keep){const i=$(`.dayadd[data-d="${d}"]`);if(i){i.value=keep[d];grow(i)}}
}
function renderFix(){
  const wk=ymd(weekStart(weekOff)), items=db.wfixT[0]||[];
  $('#wfix').innerHTML=`<span class="lbl dlb">Weekly</span>${items.map(it=>{const c=(db.wprog[wk+':'+it.id]||[0])[0];
    return `<div class="fx${c>=it.goal?' full':''}" data-fx="${it.id}"><span class="fxt">${esc(it.text)}</span><span class="fxb">${[...Array(it.goal)].map((_,i)=>`<button class="${i<c?'on':''}" data-n="${i+1}" aria-label="${i+1}"></button>`).join('')}</span><span class="fxn">${c}/${it.goal}</span><button class="fxd" aria-label="삭제">×</button></div>`}).join('')}<input class="fxadd" id="fxAdd" placeholder="+ 주간 항목  예) 운동 3" enterkeyhint="done" autocomplete="off">`;
}
function renderFocus(){
  const n=new Date(), td=todayS(), L=live();
  $('#fDay').textContent=dowL(n,true)+(U('weekNo')==='1'?' · W'+pad(isoWeek(n)):'');
  $('#fDate').textContent=bigD(n);
  const ts=weekSort(L.filter(t=>t.date===td)), late=sorted(L.filter(t=>t.date&&t.date<td&&!t.done)), dn=ts.filter(t=>t.done).length;
  $('#fProg').style.width=ts.length?dn/ts.length*100+'%':'0';
  $('#fCount').textContent=`${dn} / ${ts.length} Done`;
  $('#fList').innerHTML=(ts.map(itemHTML).join('')||'<li class="empty">오늘 할 일이 없습니다</li>')+(late.length?`<li class="grp lbl">Overdue · ${late.length}</li>`+late.map(itemHTML).join(''):'');
}

/* ---------- print (A4) ---------- */
function renderPrint(){
  const days=weekDays(weekOff), L=live(), H=holidays(), und=L.filter(t=>!t.date&&!t.done), note=(db.notes[ymd(days[0])]||[''])[0].trim();
  const pi=t=>`<div class="pi${t.done?' x':''}">${t.star?'★ ':''}${t.time?t.time+' ':''}${esc(t.text).replace(/\n/g,'<br>')}${t.cat?` <small>· ${esc(t.cat)}</small>`:''}</div>`;
  $('#print').className=U('paperPrint')==='1'&&U('paper')!=='none'?'pp-'+U('paper'):'';
  $('#print').innerHTML=`<h1><span>WEEKLY${U('weekNo')==='1'?' · W'+pad(isoWeek(days[0])):''}</span><span>${rangeTxt}</span></h1>
  ${note?`<div class="pnote">${esc(note)}</div>`:''}
  ${(db.wfixT[0]||[]).length?`<div class="pnote">${db.wfixT[0].map(it=>{const c=(db.wprog[ymd(days[0])+':'+it.id]||[0])[0];return esc(it.text)+' '+'■'.repeat(Math.min(c,it.goal))+'□'.repeat(Math.max(0,it.goal-c))}).join('　　')}</div>`:''}
  <table>${days.map(d=>{const s=ymd(d);return `<tr><td class="h">${dowL(d)}<b>${pad(d.getMonth()+1)}.${pad(d.getDate())}</b>${H[s]?`<i>${esc(H[s])}</i>`:''}</td><td class="c">${weekSort(L.filter(t=>t.date===s)).map(pi).join('')}</td></tr>`}).join('')}</table>
  ${und.length?`<div class="und"><h2>날짜 없음</h2><div class="cols">${und.map(pi).join('')}</div></div>`:''}`;
}

const ACC={bluegray:['#7489a2','#9aadc2'],steel:['#6a88ad','#93afcf'],slate:['#7b8692','#a3adb8'],sage:['#6f9095','#97b5b9'],lavender:['#8580a3','#aba6c6']};
const HAIR=[['#f2f4f6','#edf0f3','#e3e7eb','#d6dce2'],['#252a31','#2a3038','#323943','#3d4651']];
const LINE=[['#e8ebef','#e1e6eb','#d3d9e0','#c2cad3'],['#2e353e','#343c46','#3f4854','#4b5562']];
const mq=matchMedia('(prefers-color-scheme: dark)');
function applyUI(){
  const r=document.documentElement, B=document.body, dk=U('theme')==='dark'||(U('theme')==='auto'&&mq.matches)?1:0, li=+U('line')||0;
  r.dataset.theme=U('theme');
  r.style.setProperty('--fs',cfg.fs+'px');
  r.style.setProperty('--accent',(ACC[U('accent')]||ACC.bluegray)[dk]);
  r.style.setProperty('--hair',HAIR[dk][li]);r.style.setProperty('--line',LINE[dk][li]);
  r.style.setProperty('--ls',U('ls')+'em');r.style.setProperty('--lh',U('lh'));
  r.style.setProperty('--dn',{loose:1.3,normal:1,tight:.7}[U('dens')]||1);
  B.dataset.paper=U('paper');
  B.classList.toggle('collapse',U('collapse')==='1');B.classList.toggle('dimpast',U('dimPast')==='1');
  B.classList.toggle('corner',U('corner')==='1');B.classList.toggle('memoopen',U('memo')==='1');
  r.style.setProperty('--wz',cfg.wz||1);$('#wzBtn').hidden=Math.abs((cfg.wz||1)-1)<.01;$('#wzBtn').textContent=Math.round((cfg.wz||1)*100)+'%';
  requestAnimationFrame(()=>$('#themeColor').content=getComputedStyle(B).backgroundColor);
}
function paintSet(){
  $$('.seg[data-k]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',U(g.dataset.k)===b.dataset.v)));
  $$('input[data-k]').forEach(i=>{if(document.activeElement!==i)i.value=U(i.dataset.k)});
  $('[data-val=ls]').textContent=(+U('ls')).toFixed(3)+'EM';$('[data-val=lh]').textContent=(+U('lh')).toFixed(2);
  if(document.activeElement!==$('#holX'))$('#holX').value=U('holX');
  $('#fsr').value=cfg.fs;$('#fsv').textContent=cfg.fs+'PX';
  $$('#splitSeg button').forEach(b=>b.classList.toggle('on',+b.dataset.x===cfg.split));
  $$('.seg[data-c]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',cfg[g.dataset.c]===b.dataset.v)));
  $$('.sec[data-sec]').forEach(x=>x.classList.toggle('closed',!(cfg.secs||{})[x.dataset.sec]));
  if(document.activeElement!==$('#gDev'))$('#gDev').value=cfg.device;
}
const navOn=()=>$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===view||(view==='week'&&isSplit()&&b.dataset.v==='list')));
function render(){
  applyUI();renderList();renderWeek();renderFocus();navOn();
  $('#main').classList.toggle('board',view==='list'||view==='week');
  $$('.view').forEach(v=>v.classList.remove('on'));
  $({list:'#vList',week:'#vWeek',focus:'#vFocus',set:'#vSet'}[view]).classList.add('on');
  document.body.classList.toggle('split',!!cfg.split);
  paintSet();
}
function setUI(k,v,full=true){db.ui[k]=v;db.uiT=now();save(KEY,db);if(full)render();else{applyUI();paintSet()}queueSync()}
const isSplit=()=>cfg.split&&innerWidth>=1100;

