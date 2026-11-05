/* ---------- list ---------- */
const CAL=ICON.cal;
const isLate=t=>t.date&&!t.done&&(t.end||t.date)<todayS();
const on=k=>U(k)==='1';
function metaHTML(t){
  const parts=[];
  if(t.done&&t.u&&t.u.done)parts.push(`<span class="dn">✓ ${bigD(new Date(t.u.done))}</span>`);
  if(t.state==='doing'&&!t.done)parts.push('<span class="stt">진행 중</span>');
  if(t.state==='hold'&&!t.done)parts.push('<span class="stt">보류</span>');
  if(on('rDate')&&(t.date||t.time))parts.push(`<span class="date${isLate(t)?' late':''}">${when(t)}</span>`);
  if(on('dday'))parts.push(ddHTML(t));
  if(on('rRep')&&t.repeat)parts.push(`<span class="rep">↻ ${REP[t.repeat]}</span>`);
  const h=parts.join('');return h?`<div class="meta">${h}</div>`:'';
}
const chkHTML=t=>`<button class="chk${t.done?' on':''}${t.state==='doing'&&!t.done?' doing':''}" data-a="chk" aria-label="완료"${ccStyle(t)}></button>`;
function itemHTML(t){
  return `<li class="item${t.done?' done':''}${t.star&&!t.done?' starred':''}${t.state==='hold'?' hold':''}${fresh(t)}" data-id="${t.id}">
    ${chkHTML(t)}
    <div class="body" data-a="edit">
      <div class="txt">${t.star?`<span class="st">${STAR}</span>`:''}${txHTML(t)}</div>
      ${t.memo&&on('rMemo')?`<div class="memo">${md(on('memo')?t.memo:t.memo.split('\n')[0])}</div>`:''}
      ${metaHTML(t)}
    </div>
    <div class="acts"><button class="star${t.star?' on':''}" data-a="star" aria-label="중요">${STAR}</button><label class="ico${t.date?' has':''}">${CAL}<input type="date" data-a="date" value="${t.date||''}"></label></div>
  </li>`;
}
function trashHTML(t){
  return `<li class="item tr" data-id="${t.id}"><div class="body"><div class="txt"><span class="tx">${esc(t.text)}</span></div><div class="meta"><span class="dn">삭제 ${bigD(new Date(ft(t,'deleted')))}</span></div></div><button class="tbtn" data-a="restore">복원</button></li>`;
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
function dateBucket(t,td,tm,we){
  if(!t.date)return 'No date';
  if((t.end||t.date)<td)return 'Overdue';
  if(t.date<=td)return 'Today';
  if(t.date===tm)return 'Tomorrow';
  if(t.date<=we)return 'This week';
  return 'Later';
}
const isArch=t=>t.done&&ft(t,'done')<now()-30*864e5;
function renderList(){
  const L=live(), act=L.filter(t=>!t.done&&t.state!=='hold');
  const doing=sorted(act.filter(t=>t.state==='doing')), pin=sorted(act.filter(t=>t.state!=='doing'&&t.star)), rest=sorted(act.filter(t=>t.state!=='doing'&&!t.star));
  const cat=cfg.sort==='cat', bydate=cfg.sort==='date', gf=cfg.gfold||{}, cnt={};rest.forEach(t=>cnt[t.cat||'']=(cnt[t.cat||'']||0)+1);
  const gh=(k,l,n)=>`<li class="grp lbl${gf[k]?' closed':''}" data-g="${esc(k)}">${l}<span class="gn">${n}</span><i class="cv"></i></li>`;
  const sep=l=>`<li class="sep lbl">${l}</li>`;
  let h='';
  if(doing.length)h+=sep('In progress')+doing.map(itemHTML).join('');
  if(pin.length&&(cat||doing.length))h+=cat?gh('★','Starred',pin.length):sep('Starred');
  if(!(cat&&gf['★']))h+=pin.map(itemHTML).join('');
  const td=todayS(), tmD=new Date();tmD.setDate(tmD.getDate()+1);const tm=ymd(tmD), we=ymd(weekDays(0)[6]);
  let g=null;
  for(const t of rest){
    if(cat&&(t.cat||'')!==g){g=t.cat||'';h+=gh(g,esc(g||'미분류'),cnt[g])}
    if(bydate){const b=dateBucket(t,td,tm,we);if(b!==g){g=b;h+=sep(b)}}
    if(!(cat&&gf[t.cat||'']))h+=itemHTML(t);
  }
  $('#open').innerHTML=h||'<li class="empty">할 일이 없습니다</li>';
  // bin (K2, K14, K15)
  const B={done:sorted(L.filter(t=>t.done&&!isArch(t))),hold:sorted(L.filter(t=>!t.done&&t.state==='hold')),arch:L.filter(isArch).sort((a,b)=>ft(b,'done')-ft(a,'done')),trash:db.tasks.filter(t=>t.deleted&&!t.gone).sort((a,b)=>ft(b,'deleted')-ft(a,'deleted'))};
  const NM={done:'Completed',hold:'Hold',arch:'Archive',trash:'Trash'};
  if(cfg.bin&&!B[cfg.bin].length)cfg.bin='';
  $('#binTabs').innerHTML=Object.keys(B).filter(k=>B[k].length).map(k=>`<button class="${cfg.bin===k?'on':''}" data-b="${k}"><span class="lbl">${NM[k]}</span><span class="num">${B[k].length}</span></button>`).join('');
  $('#bin').hidden=!$('#binTabs').innerHTML;
  $('#binList').innerHTML=cfg.bin?(cfg.bin==='trash'?B.trash.map(trashHTML).join(''):B[cfg.bin].map(itemHTML).join('')):'';
  $('#binAct').innerHTML=cfg.bin==='trash'?'<button class="tbtn del" id="emptyTrash">휴지통 비우기</button><span class="note">삭제한 항목은 30일 뒤 자동으로 사라져요.</span>':'';
  $('#sOpen').textContent=act.length;$('#sDone').textContent=B.done.length;
  $('#vList .stat').hidden=!on('lStat');
  const n=new Date();$('#lDay').textContent=dowL(n,true);$('#lDate').textContent=bigD(n);
  $$('#sort button').forEach(b=>b.classList.toggle('on',b.dataset.s===cfg.sort));
  const cats=[...new Set(L.map(t=>t.cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  $('#cats').innerHTML=cats.map(c=>`<option value="${esc(c)}">`).join('');
  $('#catList').innerHTML=cats.length?cats.map(c=>`<div class="field"><span>${tagHTML(c)}</span><div class="sw">${[0,1,2,3,4,5,6,7].map(i=>`<button data-c="${esc(c)}" data-i="${i}" class="${catIdx(c)===i?'on':''}" style="background:var(--c${i})" aria-label="색 ${i+1}"></button>`).join('')}</div></div>`).join(''):'<p class="note">분류가 있는 할 일을 추가하면 여기에 표시됩니다.</p>';
  $('#hint').style.visibility=cfg.sort==='manual'?'visible':'hidden';
  $('#ddList').innerHTML=['both','list'].includes(U('ddPos'))?ddStrip():'';
}

/* ---------- week (Sunday start) ---------- */
function weekStart(off){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay()+off*7);return d}
function weekDays(off){const s=weekStart(off);return[...Array(7)].map((_,i)=>{const d=new Date(s);d.setDate(s.getDate()+i);return d})}
let weekDirty=false, forceWeek=false;
const big=1e15;
const weekSort=a=>a.sort((x,y)=>(on('doneBottom')?x.done-y.done:0)||(y.state==='doing')-(x.state==='doing')||((x.dord??big)-(y.dord??big))||!!y.star-!!x.star||(x.time||'99').localeCompare(y.time||'99')||x.created-y.created);
function wiHTML(t,s){
  const span=t.end&&s?(s===t.date?' span-s':s===t.end?' span-e':' span-m'):'';
  const tm=t.time&&(!t.end||s===t.date)?`<span class="tm">${fmtT(t.time)}${t.tend?'–'+fmtT(t.tend):''}</span>`:'';
  return `<div class="wi${t.done?' done':''}${t.state==='hold'?' hold':''}${span}${fresh(t)}" data-id="${t.id}">${chkHTML(t)}<div class="body" data-a="edit"><span class="txt">${t.star?`<span class="st">${STAR}</span>`:''}${tm}${txHTML(t)}${t.repeat?` <span class="rep">↻</span>`:''}</span></div></div>`;
}
const isDayAdd=el=>!!(el&&el.classList&&el.classList.contains('dayadd'));
function dhHTML(d,s,ts,H){
  const h=on('hHol')&&H[s];
  return `<div class="dh"><span class="lbl">${dowL(d)}</span><span class="d num">${pz(d.getDate())}</span>${h?`<span class="hn">${esc(H[s])}</span>`:''}${on('hEv')?evOn(s).map(x=>`<span class="hn ev">${esc(x)}</span>`).join(''):''}${on('hCnt')?`<span class="n num">${ts.length?ts.filter(t=>t.done).length+'/'+ts.length:''}</span>`:''}</div>`;
}
function renderWeek(){
  const ae=document.activeElement;
  if(!forceWeek&&isDayAdd(ae)){weekDirty=true;return}
  forceWeek=false;weekDirty=false;
  const keep={};$$('.dayadd').forEach(i=>{if(i.value)keep[i.dataset.d]=i.value});
  const days=weekDays(weekOff), L=live(), td=todayS(), H=holidays(), a=days[0], b=days[6], st=U('dstyle');
  rangeTxt=`${a.getFullYear()}.${pz(a.getMonth()+1)}.${pz(a.getDate())} – ${pz(b.getMonth()+1)}.${pz(b.getDate())}`;
  $('#wMon').textContent=`${MONU[a.getMonth()]}${a.getMonth()!==b.getMonth()?' – '+MONU[b.getMonth()]:''} ${b.getFullYear()}${on('weekNo')?' · W'+pad(isoWeek(a)):''}`;
  $('#rng').textContent=st==='en'?`${MONS[a.getMonth()]} ${a.getDate()} — ${a.getMonth()!==b.getMonth()?MONS[b.getMonth()]+' ':''}${b.getDate()}`:st==='ko'?`${a.getDate()}일 — ${b.getDate()}일`:`${pz(a.getDate())} — ${pz(b.getDate())}`;
  const wk=ymd(a), n=$('#wNote'); n.dataset.w=wk; if(ae!==n){n.value=(db.notes[wk]||[''])[0];grow(n)}
  if(ae!==$('#fxAdd'))renderFix();
  const un=sorted(L.filter(t=>!t.date&&!t.done&&t.state!=='hold'));
  $('#plan').hidden=!cfg.plan;$('#planBtn').classList.toggle('on',!!cfg.plan);$('#planBtn').textContent='PLAN'+(un.length?' '+un.length:'');
  $('#plan').innerHTML=`<div class="ph"><span class="lbl">Unscheduled · ${un.length}</span><span class="hint lbl">Hold &amp; drag to a day</span></div><div class="pl">${un.map(t=>wiHTML(t)).join('')||'<span class="empty2">날짜 없는 할 일이 없습니다</span>'}</div>`;
  $('#days').innerHTML=days.map(d=>{
    const s=ymd(d), ts=weekSort(tasksOn(L,s)), h=H[s];
    const cls=['day',s===td&&'today',s<td&&'past',(d.getDay()===0||h)&&'sun',!ts.length&&s!==td&&'empty'].filter(Boolean).join(' ');
    return `<div class="${cls}" data-d="${s}">${dhHTML(d,s,ts,H)}<div class="dl">
      ${ts.map(t=>wiHTML(t,s)).join('')}
      <div class="dadd"><textarea class="dayadd" rows="1" placeholder="+" data-d="${s}"></textarea><button class="dbtn" data-d="${s}">ADD</button></div>
    </div></div>`}).join('');
  for(const d in keep){const i=$(`.dayadd[data-d="${d}"]`);if(i){i.value=keep[d];grow(i)}}
}
function renderFix(){
  const wk=ymd(weekStart(weekOff)), items=db.wfixT[0]||[];
  $('#wfix').innerHTML=`<span class="lbl dlb">Weekly</span>${items.map(it=>{const c=(db.wprog[wk+':'+it.id]||[0])[0];
    return `<div class="fx${c>=it.goal?' full':''}" data-fx="${it.id}"><span class="fxt">${esc(it.text)}</span><span class="fxb">${[...Array(it.goal)].map((_,i)=>`<button class="${i<c?'on':''}" data-n="${i+1}" aria-label="${i+1}"></button>`).join('')}</span><span class="fxn">${c}/${it.goal}</span><button class="fxd" aria-label="삭제">×</button></div>`}).join('')}<input class="fxadd" id="fxAdd" placeholder="+ 주간 항목  예) 운동 3" enterkeyhint="done" autocomplete="off">`;
}

/* ---------- month (K20) ---------- */
let monOff=0, mSel=null;
function monthGrid(off){
  const n=new Date(), first=new Date(n.getFullYear(),n.getMonth()+off,1), st=new Date(first);st.setDate(1-first.getDay());
  let ds=[...Array(42)].map((_,i)=>{const d=new Date(st);d.setDate(st.getDate()+i);return d});
  if(ds[35].getMonth()!==first.getMonth())ds=ds.slice(0,35);
  return {first,ds};
}
function renderMonth(){
  const {first,ds}=monthGrid(monOff), m=first.getMonth(), L=live().filter(t=>t.state!=='hold'), td=todayS(), H=holidays(), st=U('dstyle');
  const inMonth=s=>parse(s).getMonth()===m&&parse(s).getFullYear()===first.getFullYear();
  if(!mSel||!inMonth(mSel))mSel=inMonth(td)?td:ymd(first);
  $('#mMon').textContent=`${MONU[m]} ${first.getFullYear()}`;
  $('#mBig').textContent=st==='en'?MONS[m]:st==='ko'?`${m+1}월`:pz(m+1);
  $('#mHead').innerHTML=[0,1,2,3,4,5,6].map(i=>`<span class="lbl${i===0?' red':''}">${U('dow')==='ko'?DOW[i]:DOWE[i]}</span>`).join('');
  $('#mGrid').innerHTML=ds.map(d=>{
    const s=ymd(d), ts=weekSort(tasksOn(L,s)), hol=H[s];
    const cls=['mc',!inMonth(s)&&'out',s===td&&'today',s===mSel&&'sel',(d.getDay()===0||hol)&&'sun',s<td&&'past'].filter(Boolean).join(' ');
    const lab=[on('hHol')&&hol?`<span class="hn">${esc(hol)}</span>`:'',...(on('hEv')?evOn(s).map(x=>`<span class="hn ev">${esc(x)}</span>`):[])].join('');
    return `<div class="${cls}" data-d="${s}"><span class="md num">${pz(d.getDate())}</span>${lab}<div class="mt">${ts.slice(0,3).map(t=>`<div class="wi mi${t.done?' done':''}${t.end?' span':''}" data-id="${t.id}"><span class="txt">${txHTML(t)}</span></div>`).join('')}${ts.length>3?`<span class="more">+${ts.length-3}</span>`:''}</div><div class="dots">${ts.slice(0,5).map(t=>`<i class="${t.done?'d':''}" style="background:${t.cat?catColor(t.cat):'var(--accent)'}"></i>`).join('')}</div></div>`}).join('');
  const sd=parse(mSel), ts=weekSort(tasksOn(L,mSel));
  $('#mpDay').textContent=dowL(sd,true);$('#mpDate').textContent=bigD(sd);
  $('#mpHol').innerHTML=[H[mSel]?`<span class="hn">${esc(H[mSel])}</span>`:'',...evOn(mSel).map(x=>`<span class="hn ev">${esc(x)}</span>`)].join('');
  $('#mpList').innerHTML=ts.map(t=>wiHTML(t,mSel)).join('')||'<span class="empty2">할 일이 없습니다</span>';
  $('#mAdd').dataset.d=mSel;
}

function renderFocus(){
  const n=new Date(), td=todayS(), L=live().filter(t=>t.state!=='hold');
  $('#fDay').textContent=dowL(n,true)+(on('weekNo')?' · W'+pad(isoWeek(n)):'');
  $('#fDate').textContent=bigD(n);
  const ts=weekSort(tasksOn(L,td)), late=sorted(L.filter(t=>isLate(t)&&t.date<td)), dn=ts.filter(t=>t.done).length;
  $('#fProg').style.width=ts.length?dn/ts.length*100+'%':'0';
  $('#fDone').textContent=dn;$('#fAll').textContent=ts.length;
  $('#fCount').textContent=ts.length?`${Math.round(dn/ts.length*100)}% Complete`:'No tasks today';
  $('#vFocus .fbar').hidden=!on('fBar');$('#fCount').hidden=!on('fBar');
  $('#wakeBtn').classList.toggle('on',!!cfg.wake);
  $('#ddFocus').innerHTML=['both','today'].includes(U('ddPos'))?ddStrip():'';
  $('#fList').innerHTML=(ts.map(itemHTML).join('')||'<li class="empty">오늘 할 일이 없습니다</li>')+(on('fLate')&&late.length?`<li class="sep lbl">Overdue · ${late.length}</li>`+late.map(itemHTML).join(''):'');
}

/* ---------- print (A4) ---------- */
let printMode='week';
const piHTML=t=>`<div class="pi${t.done?' x':''}">${t.star?'★ ':''}${t.time?fmtT(t.time)+(t.tend?'–'+fmtT(t.tend):'')+' ':''}${esc(t.text).replace(/\n/g,'<br>')}${t.cat?` <small>· ${esc(t.cat)}</small>`:''}</div>`;
function renderPrint(){
  if(printMode==='month')return renderPrintMonth();
  const days=weekDays(weekOff), L=live(), H=holidays(), und=L.filter(t=>!t.date&&!t.done), note=(db.notes[ymd(days[0])]||[''])[0].trim();
  $('#print').className=U('paperPrint')==='1'&&U('paper')!=='none'?'pp-'+U('paper'):'';
  $('#print').innerHTML=`<h1><span>WEEKLY${on('weekNo')?' · W'+pad(isoWeek(days[0])):''}</span><span>${rangeTxt}</span></h1>
  ${note?`<div class="pnote">${esc(note)}</div>`:''}
  ${(db.wfixT[0]||[]).length?`<div class="pnote">${db.wfixT[0].map(it=>{const c=(db.wprog[ymd(days[0])+':'+it.id]||[0])[0];return esc(it.text)+' '+'■'.repeat(Math.min(c,it.goal))+'□'.repeat(Math.max(0,it.goal-c))}).join('　　')}</div>`:''}
  <table>${days.map(d=>{const s=ymd(d);return `<tr><td class="h">${dowL(d)}<b>${pz(d.getMonth()+1)}.${pz(d.getDate())}</b>${H[s]?`<i>${esc(H[s])}</i>`:''}${evOn(s).map(x=>`<i class="ev">${esc(x)}</i>`).join('')}</td><td class="c">${weekSort(tasksOn(L,s)).map(piHTML).join('')}</td></tr>`}).join('')}</table>
  ${und.length?`<div class="und"><h2>날짜 없음</h2><div class="cols">${und.map(piHTML).join('')}</div></div>`:''}`;
}
function renderPrintMonth(){
  const {first,ds}=monthGrid(monOff), m=first.getMonth(), L=live(), H=holidays(), rows=[];
  for(let i=0;i<ds.length;i+=7)rows.push(ds.slice(i,i+7));
  $('#print').className='pm';
  $('#print').innerHTML=`<h1><span>MONTHLY</span><span>${first.getFullYear()}.${pz(m+1)}</span></h1>
  <table class="mtab"><tr>${DOWE.map((x,i)=>`<th${i===0?' class="r"':''}>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(d=>{const s=ymd(d);return `<td class="${d.getMonth()!==m?'o':''}"><b class="${d.getDay()===0||H[s]?'r':''}">${d.getDate()}</b>${H[s]?`<i>${esc(H[s])}</i>`:''}${evOn(s).map(x=>`<i class="ev">${esc(x)}</i>`).join('')}${weekSort(tasksOn(L,s)).map(piHTML).join('')}</td>`}).join('')}</tr>`).join('')}</table>`;
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
  B.classList.toggle('collapse',on('collapse'));B.classList.toggle('dimpast',on('dimPast'));
  B.classList.toggle('corner',on('corner'));B.classList.toggle('memoopen',on('memo'));
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
  const tab=cfg.setTab||'basic';
  $$('.sec[data-sec]').forEach(x=>{x.hidden=x.dataset.grp!==tab;x.classList.toggle('closed',(cfg.secs||{})[x.dataset.sec]===false)});
  $('#prevCard').hidden=tab!=='style';
  if(document.activeElement!==$('#gDev'))$('#gDev').value=cfg.device;
  $('#scUrl').textContent=location.origin+location.pathname+'?add=';
}
const navOn=()=>$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===view||(view==='week'&&isSplit()&&b.dataset.v==='list')));
let shownView=null;
function renderPreview(){
  const n=new Date(),s=todayS(),T=0,c=Object.keys(db.colors)[0]||'업무';
  const sm=[{id:'pv1',text:'보고서 초안 정리',cat:c,date:s,time:'10:00',tend:'11:30',created:T},{id:'pv2',text:'장보기',date:s,star:true,created:T,state:'doing'},{id:'pv3',text:'운동',date:s,done:true,created:T,cat:'건강'}];
  $('#prevCard').innerHTML=`<div class="hero"><div class="hl"><span class="lbl">${dowL(n,true)}</span><div class="big num">${bigD(n)}</div></div>${on('lStat')?'<div class="hr stat num"><div><b>2</b><span class="lbl">Open</span></div><div><b>1</b><span class="lbl">Done</span></div></div>':''}</div><ul>${sm.map(itemHTML).join('')}</ul>`;
}
function render(){
  applyUI();renderList();renderWeek();renderMonth();renderFocus();navOn();
  $('#main').classList.toggle('board',view==='list'||view==='week');
  $$('.view').forEach(v=>v.classList.remove('on'));
  $({list:'#vList',week:'#vWeek',month:'#vMonth',focus:'#vFocus',set:'#vSet'}[view]).classList.add('on');
  if(shownView!==null&&shownView!==view)$$('.view.on').forEach(v=>{v.classList.remove('enter');void v.offsetWidth;v.classList.add('enter')});
  shownView=view;
  $('#setBtn').classList.toggle('on',view==='set');
  document.body.classList.toggle('split',!!cfg.split);
  paintSet();
  if(view==='set'&&(cfg.setTab||'basic')==='style')renderPreview();
  wakeSync();
}
function setUI(k,v,full=true){db.ui[k]=v;db.uiT=now();save(KEY,db);if(full)render();else{applyUI();paintSet()}queueSync()}
const isSplit=()=>cfg.split&&innerWidth>=1100;
