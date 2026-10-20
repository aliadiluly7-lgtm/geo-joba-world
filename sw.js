const V='gjw-v30',TILES='gjw-tiles',SHELL=['./','./index.html'];
const LIBS=['leaflet','dxf-parser','simple-peer','firebasejs'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==TILES).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const isTile=u=>/tile\.openstreetmap|mt\d\.google|2gis|\/tiles\?/.test(u);
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=r.url;
  if(isTile(u)){ // cache-first, fill in background
    e.respondWith(caches.open(TILES).then(async c=>{
      const hit=await c.match(r);if(hit)return hit;
      try{const n=await fetch(r);c.put(r,n.clone());return n}catch(_){return new Response('',{status:504})}
    }));return;
  }
  if(LIBS.some(l=>u.includes(l))||r.mode==='navigate'||u.startsWith(self.location.origin)){ // stale-while-revalidate
    e.respondWith(caches.open(V).then(async c=>{
      const hit=await c.match(r)||(r.mode==='navigate'&&await c.match('./index.html'));
      const net=fetch(r).then(n=>{if(n.ok||n.type==='opaque')c.put(r,n.clone());return n}).catch(()=>hit);
      return hit||net;
    }));
  }
});
