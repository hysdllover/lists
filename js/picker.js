/* ---------- app date / time picker (K6, K12) ---------- */
let pk=null;
const setDP=(el,v)=>{if(!el)return;el.dataset.v=v||'';el.textContent=v?fmtD(v):(el.dataset.ph||'없음');el.classList.toggle('has',!!v)};
const setTP=(el,v)=>{if(!el)return;el.dataset.v=v||'';el.textContent=v?fmtT(v):(el.dataset.ph||'없음');el.classList.toggle('has',!!v)};
const getV=sel=>{const e=typeof sel==='string'?$(sel):sel;return e?e.dataset.v||'':''};
function showPk(anchor,html){
  const p=$('#pk');p.innerHTML=html;p.hidden=false;const r=anchor.getBoundingClientRect(),w=p.offsetWidth,h=p.offsetHeight;
  let top=r.bottom+8;if(top+h>innerHeight-12)top=Math.max(12,r.top-h-8);
  p.style.top=top+'px';p.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left))+'px';pk.anchor=anchor;
}
const hidePk=()=>{$('#pk').hidden=true;pk=null};
/* date */
function openDate(anchor,value,cb,opts={}){
  const base=value?parse(value):opts.from?parse(opts.from):new Date();
  pk={kind:'date',value:value||'',cb,from:opts.from||'',m:new Date(base.getFullYear(),base.getMonth(),1)};
  showPk(anchor,pkDateHTML());
}
function pkDateHTML(){
  const f=pk.m, st=new Date(f);st.setDate(1-f.getDay());
  let ds=[...Array(42)].map((_,i)=>{const d=new Date(st);d.setDate(st.getDate()+i);return d});
  if(ds[35].getMonth()!==f.getMonth())ds=ds.slice(0,35);
  const H=holidays(), td=todayS(), ev=new Set(evList().map(e=>e.date));
  const cell=d=>{const s=ymd(d),c=['pkd',d.getMonth()!==f.getMonth()&&'out',s===td&&'today',s===pk.value&&'sel',(d.getDay()===0||H[s])&&'red',pk.from&&s>=pk.from&&pk.value&&s<=pk.value&&'rng',pk.from&&s<pk.from&&'dis'].filter(Boolean).join(' ');
    return `<button class="${c}" data-pkd="${s}"${pk.from&&s<pk.from?' disabled':''}>${d.getDate()}${ev.has(s)?'<i></i>':''}</button>`};
  const q=pk.from?[['1','+1일'],['2','+2일'],['6','+1주'],['x','해제']]:[['0','오늘'],['1','내일'],['7','다음 주'],['x','해제']];
  return `<div class="pkh"><button class="ibtn" data-pkn="-1" aria-label="이전 달">${ICON.l}</button><b class="num">${f.getFullYear()}.${pz(f.getMonth()+1)}</b><button class="ibtn" data-pkn="1" aria-label="다음 달">${ICON.r}</button></div>
  <div class="pkg">${[0,1,2,3,4,5,6].map(i=>`<span class="lbl${i===0?' red':''}">${U('dow')==='ko'?DOW[i]:DOWE[i].slice(0,2)}</span>`).join('')}${ds.map(cell).join('')}</div>
  <div class="pkq">${q.map(([k,l])=>`<button class="tbtn" data-pkq="${k}">${l}</button>`).join('')}</div>`;
}
/* time */
function openTime(anchor,start,end,cb,opts={}){
  pk={kind:'time',start:start||'',end:end||'',cb,range:!!opts.range,tab:opts.tab||'start'};
  showPk(anchor,pkTimeHTML());
}
function pkTimeHTML(){
  const cur=pk.tab==='end'?pk.end:pk.start, [ch,cm]=(cur||'').split(':');
  const tabs=pk.range?`<div class="pkt"><button class="${pk.tab==='start'?'on':''}" data-pkt="start"><span class="lbl">Start</span><b class="num">${pk.start?fmtT(pk.start):'—'}</b></button><button class="${pk.tab==='end'?'on':''}" data-pkt="end"><span class="lbl">End</span><b class="num">${pk.end?fmtT(pk.end):'—'}</b></button></div>`:'';
  const hours=[...Array(24)].map((_,h)=>{const hh=pad(h),dis=pk.tab==='end'&&pk.start&&hh<pk.start.slice(0,2);
    return `<button class="pkhr${hh===ch?' sel':''}${h<7||h>21?' dim':''}" data-pkh="${hh}"${dis?' disabled':''}>${U('tfmt')==='12'?(h%12||12):h}</button>`}).join('');
  const mins=['00','15','30','45'].map(m=>`<button class="pkmi${m===cm?' sel':''}" data-pkm="${m}">:${m}</button>`).join('');
  return `${tabs}${U('tfmt')==='12'?'<div class="pkap"><span class="lbl">AM 0–11 · PM 12–23</span></div>':''}<div class="pkhg">${hours}</div><div class="pkmg">${mins}</div>
  <div class="pkq">${pk.range&&pk.start?'<button class="tbtn" data-pkdur="30">+30분</button><button class="tbtn" data-pkdur="60">+1시간</button>':''}<button class="tbtn" data-pkx="1">해제</button>${pk.range?'<button class="btn pri sm" data-pkok="1">완료</button>':''}</div>`;
}
const addMin=(hm,n)=>{const[h,m]=hm.split(':').map(Number);const t=Math.min(23*60+45,h*60+m+n);return `${pad(Math.floor(t/60))}:${pad(t%60)}`};
function pkDone(){const c=pk.cb;if(pk.kind==='date')c(pk.value);else c({start:pk.start,end:pk.end&&pk.end>pk.start?pk.end:''});hidePk()}
$('#pk').addEventListener('click',e=>{
  if(!pk)return;const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(pk.kind==='date'){
    if(d.pkn){pk.m=new Date(pk.m.getFullYear(),pk.m.getMonth()+(+d.pkn),1);$('#pk').innerHTML=pkDateHTML();return}
    if(d.pkd){pk.value=d.pkd;pkDone();return}
    if(d.pkq){pk.value=d.pkq==='x'?'':pk.from?addDays(pk.from,+d.pkq):addDays(todayS(),+d.pkq);pkDone();return}
    return;
  }
  const set=v=>{if(pk.tab==='end')pk.end=v;else pk.start=v};
  const cur=()=>pk.tab==='end'?pk.end:pk.start;
  if(d.pkt){pk.tab=d.pkt;$('#pk').innerHTML=pkTimeHTML();return}
  if(d.pkh){set(`${d.pkh}:${(cur()||'').split(':')[1]||'00'}`);$('#pk').innerHTML=pkTimeHTML();return}
  if(d.pkm){const h=(cur()||'09:00').split(':')[0];set(`${h}:${d.pkm}`);
    if(!pk.range){pkDone();return}
    if(pk.tab==='start'){pk.tab='end';if(pk.end&&pk.end<=pk.start)pk.end=''}else{pkDone();return}
    $('#pk').innerHTML=pkTimeHTML();return}
  if(d.pkdur){if(pk.start){pk.end=addMin(pk.start,+d.pkdur);pkDone()}return}
  if(d.pkx){pk.start='';pk.end='';pkDone();return}
  if(d.pkok)pkDone();
});
document.addEventListener('click',e=>{if(pk&&!e.target.closest('#pk')&&e.target!==pk.anchor&&!pk.anchor.contains(e.target))hidePk()},true);
/* generic .dp / .tp buttons */
document.addEventListener('click',e=>{
  const b=e.target.closest('.dp');
  if(b){e.preventDefault();openDate(b,b.dataset.v,v=>{setDP(b,v);b.dispatchEvent(new Event('change',{bubbles:true}))},{from:b.dataset.from?getV(b.dataset.from):''});return}
  const t=e.target.closest('.tp');
  if(t){e.preventDefault();const pair=t.dataset.pair?$(t.dataset.pair):null, isEnd=!!t.dataset.end;
    if(pair){const s=isEnd?pair:t, en=isEnd?t:pair;openTime(t,getV(s),getV(en),r=>{setTP(s,r.start);setTP(en,r.end);s.dispatchEvent(new Event('change',{bubbles:true}))},{range:true,tab:isEnd?'end':'start'})}
    else openTime(t,getV(t),'',r=>{setTP(t,r.start);t.dispatchEvent(new Event('change',{bubbles:true}))})}
});
