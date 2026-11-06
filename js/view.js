/* ---------- list ---------- */
const CAL=ICON.cal;
const isLate=t=>t.date&&!t.done&&(t.end||t.date)<todayS();
const on=k=>U(k)==='1';
function metaHTML(t){
  const parts=[];
  if(t.done&&t.u&&t.u.done)parts.push(`<span class="dn">✓ ${bigD(new Date(t.u.done))}</span>`);
  if(t.state==='doing'&&!t.done)parts.push('<span class="stt">진행 중</span>');
  if(t.state==='hold'&&!t.done)parts.push('<span class="stt">보류</span>');
  if(on('rDate')&&(t.date||t.time)&&(!TC||t.date))parts.push(`<span class="date${isLate(t)?' late':''}">${TC?whenD(t):when(t)}</span>`);
  if(on('dday'))parts.push(ddHTML(t));
  if(t.prog&&!t.done)parts.push(`<span class="pgv">${t.prog}%</span>`);
  if(on('rRep')&&t.repeat)parts.push(`<span class="rep">↻ ${REP[t.repeat]}</span>`);
  parts.push(plcHTML(t));
  const nn=t.note&&noteGet(t.note);if(nn)parts.push(`<button class="nlink" data-a="note">${ICON.note}${esc(noteTitle(nn))}</button>`);
  const h=parts.join('');return h?`<div class="meta">${h}</div>`:'';
}
let TC=false;
const tcolHTML=t=>TC?`<span class="tcol num">${t.time?fmtT(t.time):''}${t.tend?`<i>${fmtT(t.tend)}</i>`:''}</span>`:'';
const whenD=t=>t.date?fmtD(t.date)+(t.end&&t.end>t.date?' – '+fmtD(t.end):''):'';
const chkHTML=t=>`<button class="chk${t.done?' on':''}${t.state==='doing'&&!t.done?' doing':''}${t.prog&&!t.done?' pg':''}" data-a="chk" aria-label="완료"${ccStyle(t)}></button>`;
function itemHTML(t){
  return `<li class="item${t.done?' done':''}${t.star&&!t.done?' starred':''}${t.state==='hold'?' hold':''}${fresh(t)}" data-id="${t.id}">
    ${chkHTML(t)}${tcolHTML(t)}
    <div class="body" data-a="edit">
      <div class="txt">${t.star?`<span class="st">${STAR}</span>`:''}${txHTML(t)}</div>
      ${t.memo&&on('rMemo')?`<div class="memo">${md(on('memo')?t.memo:t.memo.split('\n')[0])}</div>`:''}
      ${metaHTML(t)}
    </div>
    <div class="acts"><button class="star${t.star?' on':''}" data-a="star" aria-label="중요">${STAR}</button><button class="ico${t.date?' has':''}" data-a="pickdate" aria-label="날짜">${CAL}</button></div>
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
  TC=on('tcol')&&act.some(t=>t.time);
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
  $('#open').innerHTML=h||'<li class="empty">할 일이 없습니다</li>';TC=false;
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
  renderMeta();
  $('#hint').style.visibility=cfg.sort==='manual'?'visible':'hidden';
  $('#ddList').innerHTML=['both','list'].includes(U('ddPos'))?ddStrip():'';
}
function renderMeta(){
  const cats=[...new Set(live().map(t=>t.cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  $('#cats').innerHTML=cats.map(c=>`<option value="${esc(c)}">`).join('');
  $('#catList').innerHTML=cats.length?cats.map(c=>`<div class="field"><span>${tagHTML(c)}</span><div class="sw">${[0,1,2,3,4,5,6,7].map(i=>`<button data-c="${esc(c)}" data-i="${i}" class="${catIdx(c)===i?'on':''}" style="background:var(--c${i})" aria-label="색 ${i+1}"></button>`).join('')}<label class="swc${catIdx(c)<0?' on':''}" style="${catIdx(c)<0?'background:'+catColor(c):''}" aria-label="직접 지정"><input type="color" data-cc="${esc(c)}" value="${catIdx(c)<0?db.colors[c][0]:'#a9b8c9'}"></label></div></div>`).join(''):'<p class="note">분류가 있는 할 일을 추가하면 여기에 표시됩니다.</p>';
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
  return `<div class="wi${t.done?' done':''}${t.state==='hold'?' hold':''}${span}${fresh(t)}" data-id="${t.id}">${chkHTML(t)}<div class="body" data-a="edit"><span class="txt">${t.star?`<span class="st">${STAR}</span>`:''}${tm}${txHTML(t)}${t.repeat?` <span class="rep">↻</span>`:''}</span>${t.memo&&on('rMemo')?`<div class="memo">${md(on('memo')?t.memo:t.memo.split('\n')[0])}</div>`:''}${plcHTML(t)}${t.note&&noteGet(t.note)?`<button class="nlink" data-a="note">${ICON.note}${esc(noteTitle(noteGet(t.note)))}</button>`:''}</div></div>`;
}
const isDayAdd=el=>!!(el&&el.classList&&(el.classList.contains('dayadd')||el.classList.contains('uadd')));
function dhHTML(d,s,ts,H){
  const h=on('hHol')&&H[s];
  return `<div class="dh"><span class="lbl">${dowL(d)}</span><span class="d num">${pz(d.getDate())}</span>${h?`<span class="hn">${esc(H[s])}</span>`:''}${on('hEv')?evOn(s).map(x=>`<span class="hn ev">${esc(x)}</span>`).join(''):''}${notesOn(s).map(noteTag).join('')}${on('hCnt')?`<span class="n num">${ts.length?ts.filter(t=>t.done).length+'/'+ts.length:''}</span>`:''}</div>`;
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
  const wk=ymd(a), n=$('#wNote'); n.dataset.w=wk; if(ae!==n){n.value=(db.notes[wk]||[''])[0];grow(n);$('#wNoteV').innerHTML=md(n.value);$('.dnote').classList.toggle('reading',!!n.value.trim())}
  if(ae!==$('#fxAdd'))renderFix();
  $('.dnote').hidden=!on('wNoteShow');
  renderPlan($('#plan'));
  $('#days').innerHTML=days.map(d=>{
    const s=ymd(d), ts=weekSort(tasksOn(L,s)), h=H[s];
    const cls=['day',s===td&&'today',s<td&&'past',(d.getDay()===0||h)&&'sun',!ts.length&&s!==td&&'empty'].filter(Boolean).join(' ');
    return `<div class="${cls}" data-d="${s}">${dhHTML(d,s,ts,H)}<div class="dl">
      ${ts.map(t=>wiHTML(t,s)).join('')}
      <div class="dadd"><textarea class="dayadd" rows="1" placeholder="+" data-d="${s}"></textarea><button class="dbtn" data-d="${s}">ADD</button></div>
    </div></div>`}).join('');
  for(const d in keep){const i=$(`.dayadd[data-d="${d}"]`);if(i){i.value=keep[d];grow(i)}}
}
/* compact undated tasks box (WEEK / TODAY bottom) */
function renderPlan(el){
  if(!el)return;
  const un=sorted(live().filter(t=>!t.date&&!t.done&&t.state!=='hold')), fold=!!cfg.planFold, max=cfg.planAll?1e9:8, vis=un.slice(0,max);
  const old=el.querySelector('.uadd'), keep=old?old.value:'', focus=old&&document.activeElement===old;
  el.classList.toggle('folded',fold);
  el.innerHTML=`<button class="ph planHead"><span class="lbl">No date · ${un.length}</span><i class="cv"></i></button><div class="uchips">${vis.map(t=>`<span class="wi uc${t.star?' ustar':''}" data-id="${t.id}" data-a="edit"${t.cat?` style="--ul:${catColor(t.cat)}"`:''}>${esc(t.text.split('\n')[0])}</span>`).join('')}${un.length>max?`<button class="uc more" data-umore="1">+${un.length-max}</button>`:''}${cfg.planAll&&un.length>8?'<button class="uc more" data-umore="1">접기</button>':''}<input class="uadd" placeholder="+ 날짜 없이 추가" enterkeyhint="done" autocomplete="off"></div>`;
  if(keep||focus){const n=el.querySelector('.uadd');n.value=keep;if(focus)n.focus()}
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
  const wn=on('weekNo');$('#vMonth').classList.toggle('wn',wn);
  $('#mHead').innerHTML=(wn?'<span></span>':'')+[0,1,2,3,4,5,6].map(i=>`<span class="lbl${i===0?' red':''}">${U('dow')==='ko'?DOW[i]:DOWE[i]}</span>`).join('');
  const isSpan=t=>t.end&&t.end>t.date;
  const cell=(d,lanes)=>{
    const s=ymd(d), ts=weekSort(tasksOn(L,s)).filter(t=>!isSpan(t)), hol=H[s], room=Math.max(0,3-lanes);
    const cls=['mc',!inMonth(s)&&'out',s===td&&'today',s===mSel&&'sel',(d.getDay()===0||hol)&&'sun',s<td&&'past'].filter(Boolean).join(' ');
    const lab=[on('hHol')&&hol?`<span class="hn">${esc(hol)}</span>`:'',...(on('hEv')?evOn(s).map(x=>`<span class="hn ev">${esc(x)}</span>`):[]),...notesOn(s).map(noteTag)].join('');
    return `<div class="${cls}" data-d="${s}" aria-label="${s}${hol?' '+esc(hol):''} 할 일 ${tasksOn(L,s).length}개"><span class="md num">${pz(d.getDate())}</span>${lab}<div class="mt">${ts.slice(0,room).map(t=>`<div class="wi mi${t.done?' done':''}" data-id="${t.id}"><span class="txt">${txHTML(t)}</span></div>`).join('')}${ts.length>room?`<span class="more">+${ts.length-room}</span>`:''}</div><div class="dots">${ts.slice(0,5).map(t=>`<i class="${t.done?'d':''}" style="background:${t.cat?catColor(t.cat):'var(--accent)'}"></i>`).join('')}</div></div>`;
  };
  let gh='';
  for(let r=0;r<ds.length;r+=7){
    const row=ds.slice(r,r+7), rs=ymd(row[0]), re=ymd(row[6]);
    const spans=L.filter(t=>isSpan(t)&&t.date<=re&&t.end>=rs).sort((x,y)=>x.date.localeCompare(y.date)||y.end.localeCompare(x.end));
    const lanes=[], bars=spans.map(t=>{const cs=t.date<rs?0:dayDiff(rs,t.date), ce=t.end>re?6:dayDiff(rs,t.end);let ln=lanes.findIndex(e=>e<cs);if(ln<0){ln=lanes.length;lanes.push(ce)}else lanes[ln]=ce;return {t,cs,ce,ln}}).filter(x=>x.ln<3);
    const nl=Math.min(lanes.length,3);
    gh+=`<div class="mrow" style="--lanes:${nl}">${wn?`<button class="mwk" data-w="${rs}" aria-label="${isoWeek(row[0])}주차 보기">W${pad(isoWeek(row[0]))}</button>`:''}<div class="mrin"><div class="mcells">${row.map(d=>cell(d,nl)).join('')}</div><div class="mbars">${bars.map(x=>`<div class="wi mbar${x.t.done?' done':''}" data-id="${x.t.id}" data-a="edit" style="grid-column:${x.cs+1}/${x.ce+2};grid-row:${x.ln+1};--bc:${x.t.cat?catColor(x.t.cat):'var(--accent)'}" aria-label="${esc(x.t.text.split('\n')[0])} ${x.t.date}부터 ${x.t.end}까지"><span class="txt">${esc(x.t.text.split('\n')[0])}</span></div>`).join('')}</div></div></div>`;
  }
  $('#mGrid').innerHTML=gh;
  const sd=parse(mSel), ts=weekSort(tasksOn(L,mSel));
  $('#mpDay').textContent=dowL(sd,true);$('#mpDate').textContent=bigD(sd);
  $('#mpHol').innerHTML=[H[mSel]?`<span class="hn">${esc(H[mSel])}</span>`:'',...evOn(mSel).map(x=>`<span class="hn ev">${esc(x)}</span>`)].join('');
  $('#mpList').innerHTML=ts.map(t=>wiHTML(t,mSel)).join('')||'<span class="empty2">할 일이 없습니다</span>';
  $('#mAdd').dataset.d=mSel;
}

function renderFocus(){
  const td=dayMode||todayS(), n=parse(td), isToday=td===todayS(), L=live().filter(t=>t.state!=='hold');
  $('#dnav').hidden=!dayMode;$('#vFocus').classList.toggle('daymode',!!dayMode);
  $('#fDay').textContent=dowL(n,true)+(on('weekNo')?' · W'+pad(isoWeek(n)):'');
  $('#fDate').textContent=bigD(n);
  const ts=weekSort(tasksOn(L,td)), late=isToday?sorted(L.filter(t=>isLate(t)&&t.date<td)):[], dn=ts.filter(t=>t.done).length;
  $('#fProg').style.width=ts.length?dn/ts.length*100+'%':'0';
  $('#fDone').textContent=dn;$('#fAll').textContent=ts.length;$('#fAll').nextElementSibling.textContent=isToday?'Today':'Tasks';
  $('#fCount').textContent=ts.length?`${Math.round(dn/ts.length*100)}% Complete`:isToday?'No tasks today':'No tasks';$('#fAdd').placeholder=isToday?'오늘 할 일 추가':`${bigD(n)}에 추가`;
  $('#vFocus .fbar').hidden=!on('fBar');$('#fCount').hidden=!on('fBar');
  $('#wakeBtn').classList.toggle('on',!!cfg.wake);
  $('#ddFocus').innerHTML=['both','today'].includes(U('ddPos'))?ddStrip():'';
  renderPlan($('#fPlan'));
  TC=on('tcol')&&[...ts,...late].some(t=>t.time);
  $('#fList').innerHTML=(ts.map(itemHTML).join('')||`<li class="empty">${isToday?'오늘 ':''}할 일이 없습니다</li>`)+(on('fLate')&&late.length?`<li class="sep lbl">Overdue · ${late.length}</li>`+late.map(itemHTML).join(''):'');TC=false;
}

/* ---------- print (A4) ---------- */
let printMode='week';
const piHTML=t=>`<div class="pi${t.done?' x':''}">${t.star?'★ ':''}${t.time?fmtT(t.time)+(t.tend?'–'+fmtT(t.tend):'')+' ':''}${esc(t.text).replace(/\n/g,'<br>')}${t.place?` <small>@ ${esc(t.place)}</small>`:''}${t.cat?` <small>· ${esc(t.cat)}</small>`:''}</div>`;
function renderPrint(){
  if(printMode==='month')return renderPrintMonth();
  if(!$('#vWeek').classList.contains('on'))renderWeek();
  const days=weekDays(weekOff), L=live(), H=holidays(), und=L.filter(t=>!t.date&&!t.done), note=(db.notes[ymd(days[0])]||[''])[0].trim();
  $('#print').className=U('paperPrint')==='1'&&U('paper')!=='none'?'pp-'+U('paper'):'';
  $('#print').innerHTML=`<h1><span>${esc(U('appName')||'WEEKLY')}${on('weekNo')?' · W'+pad(isoWeek(days[0])):''}</span><span>${rangeTxt}</span></h1>
  ${note?`<div class="pnote">${esc(note)}</div>`:''}
  ${(db.wfixT[0]||[]).length?`<div class="pnote">${db.wfixT[0].map(it=>{const c=(db.wprog[ymd(days[0])+':'+it.id]||[0])[0];return esc(it.text)+' '+'■'.repeat(Math.min(c,it.goal))+'□'.repeat(Math.max(0,it.goal-c))}).join('　　')}</div>`:''}
  <table>${days.map(d=>{const s=ymd(d);return `<tr><td class="h">${dowL(d)}<b>${pz(d.getMonth()+1)}.${pz(d.getDate())}</b>${H[s]?`<i>${esc(H[s])}</i>`:''}${evOn(s).map(x=>`<i class="ev">${esc(x)}</i>`).join('')}</td><td class="c">${weekSort(tasksOn(L,s)).map(piHTML).join('')}</td></tr>`}).join('')}</table>
  ${und.length?`<div class="und"><h2>날짜 없음</h2><div class="cols">${und.map(piHTML).join('')}</div></div>`:''}`;
}
function renderPrintMonth(){
  const {first,ds}=monthGrid(monOff), m=first.getMonth(), L=live(), H=holidays(), rows=[];
  for(let i=0;i<ds.length;i+=7)rows.push(ds.slice(i,i+7));
  $('#print').className='pm';
  $('#print').innerHTML=`<h1><span>${esc(U('appName')||'WEEKLY')} · MONTH</span><span>${first.getFullYear()}.${pz(m+1)}</span></h1>
  <table class="mtab"><tr>${DOWE.map((x,i)=>`<th${i===0?' class="r"':''}>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(d=>{const s=ymd(d);return `<td class="${d.getMonth()!==m?'o':''}"><b class="${d.getDay()===0||H[s]?'r':''}">${d.getDate()}</b>${H[s]?`<i>${esc(H[s])}</i>`:''}${evOn(s).map(x=>`<i class="ev">${esc(x)}</i>`).join('')}${weekSort(tasksOn(L,s)).map(piHTML).join('')}</td>`}).join('')}</tr>`).join('')}</table>`;
}

const ACC={bluegray:['#7489a2','#9aadc2'],steel:['#6a88ad','#93afcf'],slate:['#7b8692','#a3adb8'],sage:['#6f9095','#97b5b9'],lavender:['#8580a3','#aba6c6']};
const HAIR=[['#f2f4f6','#edf0f3','#e3e7eb','#d6dce2'],['#252a31','#2a3038','#323943','#3d4651']];
const LINE=[['#e8ebef','#e1e6eb','#d3d9e0','#c2cad3'],['#2e353e','#343c46','#3f4854','#4b5562']];
const mq=matchMedia('(prefers-color-scheme: dark)');
const PRESET={
  sage:{accent:'sage',bg:[['#f8faf8','#ffffff'],['#1b201d','#222823']],cat:['#a9c2b6','#b8c9a6','#d1c3a6','#b6b9c9','#a3c3c5','#cdc39e','#c7b1b3','#b5bdb8']},
  warm:{accent:'custom',accentC:'#8d8279',bg:[['#faf9f7','#ffffff'],['#201e1c','#282522']],cat:['#cdbba8','#c9b0b0','#b9b49d','#b5aec0','#a9bcb7','#d3c09a','#c2b3a5','#bab5ae']},
  mono:{accent:'slate',bg:[['#fafafa','#ffffff'],['#1c1c1e','#242427']],cat:['#b9bec4','#c3c7c0','#c9c4bd','#bfbcc6','#b7c2c2','#c9c5b8','#c6bcbe','#bdbdbd']}};
function applyUI(){
  const r=document.documentElement, B=document.body, dk=U('theme')==='dark'||(U('theme')==='auto'&&mq.matches)?1:0, li=+U('line')||0;
  r.dataset.theme=U('theme');
  r.style.setProperty('--fs',cfg.fs+'px');
  {const P=PRESET[U('preset')]||null;
   ['bg','surface'].forEach((k,i)=>{if(P)r.style.setProperty('--'+k,P.bg[dk][i]);else r.style.removeProperty('--'+k)});
   for(let i=0;i<8;i++){if(P)r.style.setProperty('--c'+i,dk?`color-mix(in srgb, ${P.cat[i]} 55%, #1b1f24)`:P.cat[i]);else r.style.removeProperty('--c'+i)}}
  r.style.setProperty('--tk',{s:.9,m:1,l:1.12}[U('taskFs')]||1);
  ['chkColor','lateColor','tabSz','toastPos'].forEach(k=>{B.dataset[k]=U(k)});
  r.style.setProperty('--accent',U('accent')==='custom'?toneAcc(U('accentC'),dk):(ACC[U('accent')]||ACC.bluegray)[dk]);
  $('.brand').textContent=U('appName')||'WEEKLY';document.title=U('appName')||'Weekly';
  applyTabs();
  r.style.setProperty('--hair',HAIR[dk][li]);r.style.setProperty('--line',LINE[dk][li]);
  r.style.setProperty('--ls',U('ls')+'em');r.style.setProperty('--lh',U('lh'));
  r.style.setProperty('--t-big',{s:'2.3rem',m:'2.9rem',l:'3.6rem'}[U('bigSz')]||'2.9rem');B.classList.toggle('t12',U('tfmt')==='12');
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
  $$('[data-preset] button').forEach(b=>b.classList.toggle('on',(U('preset')||'default')===b.dataset.v));
  $$('.seg[data-c]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',cfg[g.dataset.c]===b.dataset.v)));
  const tab=cfg.setTab||'basic';
  $$('.sec[data-sec]').forEach(x=>{x.hidden=x.dataset.grp!==tab;x.classList.toggle('closed',(cfg.secs||{})[x.dataset.sec]===false)});
  $('#prevCard').hidden=tab!=='style';
  if(document.activeElement!==$('#gDev'))$('#gDev').value=cfg.device;
  $('#scUrl').textContent=location.origin+location.pathname+'?add=';
  const eh=(U('eHide')||'').split(',');$$('[data-eh]').forEach(b=>b.classList.toggle('on',eh.includes(b.dataset.eh)===(b.dataset.h==='1')));
  $('#verNow').textContent='VERSION '+APP_VER;
  if(tab==='info'){
    const dv=Object.entries(db.devices||{}).sort((a,b)=>b[1][1]-a[1][1]);
    $('#devList').innerHTML=dv.length?dv.map(([n,v])=>`<div class="field"><span>${esc(n)}${n===cfg.device?' <small class="me">이 기기</small>':''}</span><b class="num verv">${fmtTs(v[1])}</b></div>`).join(''):'<p class="note">Gist 동기화를 연결하면 동기화에 참여한 기기가 여기에 표시돼요.</p>';
    $('#chgList').innerHTML=Object.keys(CHANGES).sort((a,b)=>b-a).map(v=>`<div class="chg"><b class="num">${v}</b><span>${esc(CHANGES[v])}</span></div>`).join('');
  }
  if(document.activeElement!==$('#appName'))$('#appName').value=U('appName')||'';
  $$('.accC').forEach(i=>{if(document.activeElement!==i)i.value=U('accentC');const l=i.parentElement,c=U('accent')==='custom';l.classList.toggle('on',c);l.style.background=c?toneAcc(U('accentC'),isDark()):''});
  const ord=tabOrder(),hid=tabHidden();
  $('#tabCfg').innerHTML=ord.map((k,i)=>`<div class="field tabrow"><span>${TABN[k]}</span><button class="tbtn" data-tmv="${k}" data-dir="-1"${i===0?' disabled':''} aria-label="위로">↑</button><button class="tbtn" data-tmv="${k}" data-dir="1"${i===ord.length-1?' disabled':''} aria-label="아래로">↓</button><div class="seg"><button class="${hid.includes(k)?'':'on'}" data-thd="${k}" data-h="0">표시</button><button class="${hid.includes(k)?'on':''}" data-thd="${k}" data-h="1">숨김</button></div></div>`).join('');
}
const TABN={list:'LIST',week:'WEEK',month:'MONTH',focus:'TODAY',notes:'NOTE'};
const tabOrder=()=>{const o=(U('tabOrder')||'').split(',').filter(k=>TABN[k]);for(const k in TABN)if(!o.includes(k))o.push(k);return o};
const tabHidden=()=>(U('tabHide')||'').split(',').filter(k=>TABN[k]);
function applyTabs(){const nav=$('nav'),hid=tabHidden();tabOrder().forEach(k=>{const b=nav.querySelector(`[data-v="${k}"]`);if(b){nav.appendChild(b);b.hidden=hid.includes(k)}});
  if(TABN[view]&&hid.includes(view))view=tabOrder().find(k=>!hid.includes(k))||'list'}
const navOn=()=>$$('nav button').forEach(b=>b.classList.toggle('on',(view==='focus'&&dayMode)?b.dataset.v==='week':(b.dataset.v===view||(view==='week'&&isSplit()&&b.dataset.v==='list'))));
let shownView=null;
function renderPreview(){
  const n=new Date(),s=todayS(),T=0,c=Object.keys(db.colors)[0]||'업무';
  const sm=[{id:'pv1',text:'보고서 초안 정리',cat:c,date:s,time:'10:00',tend:'11:30',created:T},{id:'pv2',text:'장보기',date:s,star:true,created:T,state:'doing'},{id:'pv3',text:'운동',date:s,done:true,created:T,cat:'건강'}];
  $('#prevCard').innerHTML=`<div class="hero"><div class="hl"><span class="lbl">${dowL(n,true)}</span><div class="big num">${bigD(n)}</div></div>${on('lStat')?'<div class="hr stat num"><div><b>2</b><span class="lbl">Open</span></div><div><b>1</b><span class="lbl">Done</span></div></div>':''}</div><ul>${sm.map(itemHTML).join('')}</ul>`;
}
function setMini(){
  const n=new Date(),t='';let s='';
  if(view==='list')s=`${bigD(n)} · ${dowL(n)}`;
  else if(view==='week'){const d=weekDays(weekOff),a=d[0],b=d[6];s=`${pz(a.getMonth()+1)}.${pz(a.getDate())} – ${a.getMonth()!==b.getMonth()?pz(b.getMonth()+1)+'.':''}${pz(b.getDate())}${on('weekNo')?' · W'+pad(isoWeek(a)):''}`}
  else if(view==='month')s=$('#mMon').textContent;
  else if(view==='focus'){const d=dayMode?parse(dayMode):n;s=`${bigD(d)} · ${dowL(d)} · ${$('#fDone').textContent}/${$('#fAll').textContent}`}
  else if(view==='notes'){const x=noteGet(cfg.noteOpen);s=x?noteTitle(x):'Notes'}
  else s='Settings';
  $('#mini').textContent=s;
}
function render(){
  applyUI();
  const both=isSplit()&&(view==='list'||view==='week');
  if(view==='list'||both)renderList();else renderMeta();
  if(view==='week'||both)renderWeek();
  if(view==='month')renderMonth();
  if(view==='focus')renderFocus();
  if(view==='notes')renderNotes();
  navOn();
  $('#main').classList.toggle('board',view==='list'||view==='week');
  $$('.view').forEach(v=>v.classList.remove('on'));
  $({list:'#vList',week:'#vWeek',month:'#vMonth',focus:'#vFocus',notes:'#vNotes',set:'#vSet'}[view]).classList.add('on');
  if(shownView!==null&&shownView!==view)$$('.view.on').forEach(v=>{v.classList.remove('enter');void v.offsetWidth;v.classList.add('enter')});
  shownView=view;
  $('#setBtn').classList.toggle('on',view==='set');
  document.body.classList.toggle('split',!!cfg.split);
  paintSet();
  if(view==='set'&&(cfg.setTab||'basic')==='style')renderPreview();
  wakeSync();setMini();
}
function setUI(k,v,full=true){db.ui[k]=v;db.uiT=now();save(KEY,db);if(full)render();else{applyUI();paintSet()}queueSync()}
const isSplit=()=>cfg.split&&innerWidth>=1100;
