const C='weekly-v19',A=['./','index.html','css/app.css','app.js','manifest.webmanifest','icon-180.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(u=>new Request(u,{cache:'reload'})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const q=e.request,u=new URL(q.url);
  if(q.method!=='GET'||u.hostname==='api.github.com')return;
  const same=u.origin===location.origin;
  e.respondWith((same?fetch(u.href,{cache:'no-store'}):fetch(q)).then(r=>{
    if(r.ok&&(same||u.hostname.includes('fonts.g'))){const c=r.clone();caches.open(C).then(x=>x.put(q,c))}
    return r;
  }).catch(()=>caches.match(q,{ignoreSearch:true})));
});
