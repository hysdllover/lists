/* ---------- week image ---------- */
async function weekImage(ratio='long'){
  try{await document.fonts.ready}catch{}
  const days=weekDays(weekOff), L=live(), H=holidays(), td=todayS(), cs=getComputedStyle(document.documentElement), V=k=>cs.getPropertyValue(k).trim();
  const C={bg:getComputedStyle(document.body).backgroundColor,text:V('--text'),sub:V('--sub'),faint:V('--faint'),line:V('--line'),hair:V('--hair'),acc:V('--accent'),red:V('--danger'),surf:V('--surface')};
  const fam=V('--font')||'sans-serif', W=1080, P=84, LW=170, TX=P+LW+40, TW=W-P-TX, S=2;
  const cv=document.createElement('canvas'), x=cv.getContext('2d');
  const font=(w,z)=>`${w} ${z}px ${fam}`, sp=v=>{if('letterSpacing' in x)x.letterSpacing=v+'px'};
  const wrap=(t,f)=>{x.font=f;sp(0);const out=[];for(const para of String(t).split('\n')){let l='';for(const ch of para){if(l&&x.measureText(l+ch).width>TW){out.push(l);l=ch}else l+=ch}out.push(l)}return out};
  const note=((db.notes[ymd(days[0])]||[''])[0]||'').trim();
  const fixLine=(db.wfixT[0]||[]).map(it=>{const c=(db.wprog[ymd(days[0])+':'+it.id]||[0])[0];return it.text+' '+'■'.repeat(Math.min(c,it.goal))+'□'.repeat(Math.max(0,it.goal-c))}).join('    ');
  const pass=draw=>{
    let y=P;
    const txt=(t,X,Y,f,c,l=0)=>{if(!draw)return;x.font=f;sp(l);x.fillStyle=c;x.fillText(t,X,Y)};
    const hl=(Y,c)=>{if(draw){x.fillStyle=c;x.fillRect(P,Y,W-P*2,1.5)}};
    txt($('#wMon').textContent,P,y+20,font(400,19),C.sub,4);y+=34;
    txt($('#rng').textContent,P-3,y+88,font(200,92),C.text,-2);y+=126;
    if(note){const ls=wrap(note,font(300,26));ls.forEach((l,i)=>txt(l,P,y+28+i*40,font(300,26),C.sub));y+=ls.length*40+28}
    if(fixLine){const ls=wrap(fixLine,font(300,24));ls.forEach((l,i)=>txt(l,P,y+26+i*38,font(300,24),C.sub));y+=ls.length*38+26}
    hl(y,C.line);
    for(const d of days){
      const s=ymd(d), ts=weekSort(tasksOn(L,s)), top=y, red=d.getDay()===0||H[s];
      txt(dowL(d),P,top+42,font(400,16),red?C.red:C.sub,3);
      txt(pz(d.getDate()),P-2,top+98,font(200,54),s===td?C.acc:C.text,-1);
      let hy=top+126;if(H[s]){txt(H[s],P,hy,font(400,15),C.red);hy+=20}
      for(const ev of evOn(s)){txt(ev,P,hy,font(400,15),C.acc);hy+=20}
      let ty=top+30;
      for(const t of ts){
        const f=font(300,28), ls=wrap((t.star?'★ ':'')+(t.time&&(!t.end||s===t.date)?fmtT(t.time)+(t.tend?'–'+fmtT(t.tend):'')+'  ':'')+t.text,f);
        if(draw){
          if(t.done){x.fillStyle=C.acc;x.fillRect(P+LW,ty+5,22,22);x.strokeStyle=C.surf;x.lineWidth=2;x.beginPath();x.moveTo(P+LW+5,ty+16);x.lineTo(P+LW+10,ty+21);x.lineTo(P+LW+18,ty+11);x.stroke()}
          else{x.strokeStyle=C.faint;x.lineWidth=1.5;x.strokeRect(P+LW+.75,ty+5.75,20.5,20.5)}
        }
        ls.forEach((l,i)=>{const Y=ty+26+i*42;txt(l,TX,Y,f,t.done?C.faint:C.text);
          if(draw&&l){x.font=f;sp(0);const w=x.measureText(l).width;
            if(t.done){x.fillStyle=C.faint;x.fillRect(TX,Y-9,w,1.5)}
            else if(t.cat){x.fillStyle=(c=>c.startsWith('var')?V(c.slice(4,-1)):c)(catColor(t.cat));x.fillRect(TX,Y+9,w,2)}}});
        ty+=ls.length*42+14;
      }
      y=Math.max(top+150,ty+20,hy+10);hl(y,C.hair);
    }
    y+=46;txt(U('appName')||'WEEKLY',P,y+14,font(400,15),C.faint,6);
    return y+P;
  };
  const h=pass(false), RT={long:0,'45':1.25,'11':1,wall:2796/1290}[ratio]||0;
  if(!RT){cv.width=W*S;cv.height=h*S;x.scale(S,S);x.fillStyle=C.bg;x.fillRect(0,0,W,h);pass(true)}
  else{const Ht=Math.round(W*RT), top=ratio==='wall'?Ht*.3:0, avail=Ht-top-(ratio==='wall'?Ht*.08:0), k=Math.min(1,avail/h);
    cv.width=W*S;cv.height=Ht*S;x.scale(S,S);x.fillStyle=C.bg;x.fillRect(0,0,W,Ht);
    x.translate((W-W*k)/2,top+(avail-h*k)/2);x.scale(k,k);pass(true)}
  cv.toBlob(async b=>{
    const f=new File([b],`weekly-${ymd(days[0])}${ratio==='long'?'':'-'+ratio}.png`,{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f]})}catch{}}
    else{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=f.name;a.click()}
  },'image/png');
}


/* ---------- month image (K20) ---------- */
function shareCanvas(cv,name){
  cv.toBlob(async b=>{
    const f=new File([b],name,{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f]})}catch{}}
    else{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=f.name;a.click()}
  },'image/png');
}
async function monthImage(){
  try{await document.fonts.ready}catch{}
  const {first,ds}=monthGrid(monOff), m=first.getMonth(), L=live().filter(t=>t.state!=='hold'), H=holidays(), td=todayS(), cs=getComputedStyle(document.documentElement), V=k=>cs.getPropertyValue(k).trim();
  const C={bg:getComputedStyle(document.body).backgroundColor,text:V('--text'),sub:V('--sub'),faint:V('--faint'),line:V('--line'),hair:V('--hair'),acc:V('--accent'),red:V('--danger')};
  const fam=V('--font')||'sans-serif', W=1080, P=64, CW=(W-P*2)/7, CH=158, S=2, rows=ds.length/7, Y0=P+170, Hh=Y0+44+rows*CH+P;
  const cv=document.createElement('canvas'), x=cv.getContext('2d');cv.width=W*S;cv.height=Hh*S;x.scale(S,S);x.fillStyle=C.bg;x.fillRect(0,0,W,Hh);
  const font=(w,z)=>`${w} ${z}px ${fam}`, sp=v=>{if('letterSpacing' in x)x.letterSpacing=v+'px'};
  const txt=(t,X,Y,f,c,l=0)=>{x.font=f;sp(l);x.fillStyle=c;x.fillText(t,X,Y)};
  const fit=(t,f,w)=>{x.font=f;sp(0);if(x.measureText(t).width<=w)return t;while(t&&x.measureText(t+'…').width>w)t=t.slice(0,-1);return t+'…'};
  const st=U('dstyle');
  txt(`${MONU[m]} ${first.getFullYear()}`,P,P+20,font(400,19),C.sub,4);
  txt(st==='en'?MONS[m]:st==='ko'?`${m+1}월`:pz(m+1),P-3,P+118,font(200,92),C.text,-2);
  DOWE.forEach((d,i)=>txt(U('dow')==='ko'?DOW[i]:d,P+i*CW+6,Y0+22,font(400,15),i===0?C.red:C.sub,3));
  x.fillStyle=C.line;x.fillRect(P,Y0+36,W-P*2,1.5);
  ds.forEach((d,i)=>{
    const s=ymd(d), col=i%7, row=Math.floor(i/7), X=P+col*CW, Y=Y0+44+row*CH, out=d.getMonth()!==m, ts=weekSort(tasksOn(L,s));
    if(row){x.fillStyle=C.hair;x.fillRect(P,Y,W-P*2,1)}
    if(col){x.fillStyle=C.hair;x.fillRect(X,Y,1,CH)}
    const red=d.getDay()===0||H[s];
    txt(pz(d.getDate()),X+8,Y+30,font(s===td?400:300,24),out?C.faint:s===td?C.acc:red?C.red:C.text);
    let ty=Y+54;
    const labs=[...(H[s]?[[H[s],C.red]]:[]),...evOn(s).map(n=>[n,C.acc])];
    for(const [n,c] of labs.slice(0,1)){txt(fit(n,font(400,13),CW-16),X+8,ty,font(400,13),out?C.faint:c);ty+=20}
    ts.slice(0,3).forEach(t=>{const f=font(300,16),l=fit(t.text.split('\n')[0],f,CW-16);txt(l,X+8,ty+4,f,t.done||out?C.faint:C.text);
      if(t.cat&&!t.done){x.font=f;sp(0);x.fillStyle=(c=>c.startsWith('var')?V(c.slice(4,-1)):c)(catColor(t.cat));x.fillRect(X+8,ty+9,x.measureText(l).width,1.5)}ty+=25});
    if(ts.length>3)txt(`+${ts.length-3}`,X+8,ty+4,font(400,13),C.faint);
  });
  txt(U('appName')||'WEEKLY',P,Hh-P+30,font(400,15),C.faint,6);
  shareCanvas(cv,`weekly-${first.getFullYear()}-${pz(m+1)}.png`);
}
