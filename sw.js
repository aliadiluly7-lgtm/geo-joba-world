/* GEO JOBA WORLD v29 - OFFLINE - TILE CACHE - WORLD FIRST */
const V = 'gjw-v29';
const TILES = 'gjw-tiles-v29';
const SHELL = [
  '/',
  '/index.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/dxf-parser@1.1.2/dist/dxf-parser.js'
];
const TILE_RE = /(tile.openstreetmap.org|server.arcgisonline.com|tile.opentopomap.org)/;
const API_RE = /(router.project-osrm.org|overpass-api.de)/;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c => 
      Promise.all(SHELL.map(u => 
        c.add(new Request(u, {mode: u.startsWith('http') ? 'no-cors' : 'same-origin'})).catch(()=>null)
      ))
    ).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => 
      Promise.all(ks.filter(k => k !== V && k !== TILES).map(k => caches.delete(k)))
    ).then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if(r.method !== 'GET') return;
  const url = r.url;
  
  if(TILE_RE.test(url)){
    e.respondWith(
      caches.open(TILES).then(async c => {
        let hit = await c.match(r);
        if(hit) return hit;
        try{
          let res = await fetch(r);
          if(res && (res.ok || res.type === 'opaque')) c.put(r, res.clone());
          return res;
        }catch{
          return new Response('', {status: 504});
        }
      })
    );
    return;
  }
  
  if(API_RE.test(url)){
    e.respondWith(
      fetch(r).then(res => {
        if(res.ok){
          let cp = res.clone();
          caches.open(V).then(c => c.put(r, cp));
        }
        return res;
      }).catch(() => caches.match(r).then(h => h || new Response('{}', {status: 504})))
    );
    return;
  }
  
  e.respondWith(
    caches.match(r, {ignoreSearch:true}).then(hit => {
      let net = fetch(r).then(res => {
        if(res && (res.ok || res.type === 'opaque')){
          let cp = res.clone();
          caches.open(V).then(c => c.put(r, cp));
        }
        return res;
      }).catch(() => hit || (r.mode === 'navigate' ? caches.match('/index.html') : new Response('', {status: 504})));
      return hit || net;
    })
  );
});
