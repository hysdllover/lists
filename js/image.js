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
      const s=ymd(d), ts=weekSort(L.filter(t=>t.date===s)), top=y, red=d.getDay()===0||H[s];
      txt(dowL(d),P,top+42,font(400,16),red?C.red:C.sub,3);
      txt(pad(d.getDate()),P-2,top+98,font(200,54),s===td?C.acc:C.text,-1);
      if(H[s])txt(H[s],P,top+126,font(400,15),C.red);
      let ty=top+30;
      for(const t of ts){
        const f=font(300,28), ls=wrap((t.star?'★ ':'')+(t.time?t.time+'  ':'')+t.text,f);
        if(draw){
          if(t.done){x.fillStyle=C.acc;x.fillRect(P+LW,ty+5,22,22);x.strokeStyle=C.surf;x.lineWidth=2;x.beginPath();x.moveTo(P+LW+5,ty+16);x.lineTo(P+LW+10,ty+21);x.lineTo(P+LW+18,ty+11);x.stroke()}
          else{x.strokeStyle=C.faint;x.lineWidth=1.5;x.strokeRect(P+LW+.75,ty+5.75,20.5,20.5)}
        }
        ls.forEach((l,i)=>{const Y=ty+26+i*42;txt(l,TX,Y,f,t.done?C.faint:C.text);
          if(draw&&l){x.font=f;sp(0);const w=x.measureText(l).width;
            if(t.done){x.fillStyle=C.faint;x.fillRect(TX,Y-9,w,1.5)}
            else if(t.cat){x.fillStyle=V('--c'+catIdx(t.cat));x.fillRect(TX,Y+9,w,2)}}});
        ty+=ls.length*42+14;
      }
      y=Math.max(top+150,ty+20);hl(y,C.hair);
    }
    y+=46;txt('WEEKLY',P,y+14,font(400,15),C.faint,6);
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

