// Service worker: guarda o app inteiro no aparelho na instalação, para funcionar sem internet.
// Código (html/css/js): busca na rede primeiro (até 4s) e guarda; sem internet usa o cache. Assim html e js nunca ficam
// em versões misturadas e mudanças de código chegam sem precisar mexer em VERSAO.
// Desenhos/máscaras/imagens: só do cache. Ao trocar qualquer arte, aumente VERSAO para os aparelhos baixarem de novo.
// o escopo entra no nome: duas versões do app no mesmo domínio (com/sem cadastro) não apagam o cache uma da outra
const ESCOPO=self.registration.scope,VERSAO='garagem-v2|'+ESCOPO;
const pad=i=>String(i).padStart(2,'0');
// a página entra só como './': alguns servidores (Cloudflare) redirecionam index.html -> ./, e o navegador
// não abre como página uma resposta guardada que veio de redirecionamento (quebraria o modo sem internet)
const ARQUIVOS=['./','css/style.css','js/app.js','js/config.js','manifest.webmanifest','assets/cover.jpg',
  'assets/games/acd.png','assets/games/maze.mask','assets/games/maze.png','assets/games/truck.png',
  'assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/apple-touch-icon.png','assets/icons/favicon-64.png',
  ...Array.from({length:11},(_,i)=>['assets/color/'+pad(i)+'.png','assets/color/'+pad(i)+'.mask']).flat()];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSAO).then(c=>c.addAll(ARQUIVOS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSAO&&(k.endsWith('|'+ESCOPO)||!k.includes('|'))).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  const codigo=r.mode==='navigate'||/\.(html|css|js|webmanifest)$/.test(u.pathname);
  e.respondWith(caches.open(VERSAO).then(async c=>{
    const doCache=async()=>await c.match(r,{ignoreSearch:true})||(r.mode==='navigate'?await c.match('./'):undefined);
    if(codigo){
      const rede=fetch(r).then(resp=>{if(resp.ok)c.put(r,resp.clone());return resp});
      const limite=new Promise(ok=>setTimeout(ok,4000));
      try{const resp=await Promise.race([rede,limite.then(doCache)]);if(resp)return resp}catch(_){}
      return await doCache()||rede}
    const salvo=await doCache();if(salvo)return salvo;
    const resp=await fetch(r);if(resp.ok)c.put(r,resp.clone());return resp}))});
