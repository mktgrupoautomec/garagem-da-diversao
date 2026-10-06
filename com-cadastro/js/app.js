
const $=id=>document.getElementById(id);
const NAMES=["Onix", "Tracker", "Spark EV", "Camaro", "Blazer EV", "Sonic", "Captiva EV", "Equinox", "Montana", "S10", "Spin"];
const IMG={cover:'assets/cover.jpg',c:i=>'assets/color/'+String(i).padStart(2,'0')+'.png',m:i=>'assets/color/'+String(i).padStart(2,'0')+'.mask',truck:'assets/games/truck.png',maze:'assets/games/maze.png',mm:'assets/games/maze.mask',acd:'assets/games/acd.png'};
async function loadBits(url,n){const r=await fetch(url);const b=new Uint8Array(await r.arrayBuffer());const o=new Uint8Array(n);for(let k=0;k<n;k++)o[k]=(b[k>>3]>>(7-(k&7)))&1;return o}
$('cover').src=IMG.cover;
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
NAMES.forEach((n,i)=>{const b=document.createElement('button');b.className='card';b.innerHTML='<img src="'+IMG.c(i)+'" alt=""><span>'+n+'</span>';b.onclick=()=>openColor(i);$('gc').appendChild(b)});
let from='home';
function show(s,t){if(s!=='color')flush();['home','color','game','gal','cad'].forEach(x=>$(x).classList.toggle('hide',x!==s));$('bk').classList.toggle('hide',s==='home'||s==='cad');$('tt').textContent=t||'🚗 Garagem da Diversão';scrollTo(0,0)}
$('bk').onclick=()=>{if(!$('color').classList.contains('hide')&&from==='gal')openGal();else show('home')};
/* ---------- SONS (Web Audio, sintetizados: sem arquivos, funcionam offline) ---------- */
let AC=null;const ac=()=>{try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}return AC};
addEventListener('pointerdown',ac,true); // iOS só libera o áudio depois de um toque
function tom(f,t0,d,v,tipo){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+t0;o.type=tipo||'sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v||.18,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.05)}
const somAcerto=()=>{tom(880,0,.12);tom(1318.5,.07,.22)};
const somFim=()=>[523.25,659.25,783.99,1046.5].forEach((f,i)=>tom(f,i*.13,i===3?.6:.2,.2,'triangle'));
function win(m,som){if(som!==false)somFim();const t=$('toast');t.innerHTML='🎉 '+(m||'Parabéns!')+' 🎉';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
/* ---------- SALVAR PROGRESSO (IndexedDB) ----------
   Guarda a LISTA DE AÇÕES de cada desenho (balde, traço, limpar) e redesenha ao abrir.
   Não exporta pixels da tela (toBlob/getImageData): no aparelho do cliente a leitura de pixels voltou vazia. */
const DB=new Promise((ok,er)=>{const r=indexedDB.open('garagem',1);r.onupgradeneeded=()=>r.result.createObjectStore('pinturas');r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)}).catch(()=>null);
async function db(mode,fn){const d=await DB;if(!d)return;return new Promise(ok=>{const tx=d.transaction('pinturas',mode),rq=fn(tx.objectStore('pinturas'));tx.oncomplete=()=>ok(rq.result);tx.onerror=tx.onabort=()=>ok()})}
const dbGet=i=>db('readonly',s=>s.get(i)),dbPut=(i,v)=>db('readwrite',s=>s.put(v,i)),dbDel=i=>db('readwrite',s=>s.delete(i));
let saveT=null,dirty=false;
function save(){dirty=true;clearTimeout(saveT);saveT=setTimeout(flush,400)}
function flush(){clearTimeout(saveT);if(!dirty)return;dirty=false;const o=live(ops);return o.length?dbPut(cur,{ops:o,t:Date.now()}):dbDel(cur)}
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()});addEventListener('pagehide',flush);
const live=o=>{let k=o.length;while(k--)if(o[k].t==='c')return o.slice(k+1);return o.slice()};
/* ---------- PINTAR ---------- */
const COLORS=['#e53935','#fb8c00','#fdd835','#7cb342','#2e7d32','#00acc1','#1e88e5','#283593','#8e24aa','#ec407a','#8d6e63','#5d4037','#9e9e9e','#212121','#ffffff','#ffcc99'];
const cc=$('cc'),cx=cc.getContext('2d'),W=1311,H=924;
let col=COLORS[0],tool='fill',size=18,light=null,hist=[],ops=[],drawing=false,lp,sop;
function tools(){const t=$('tl');t.innerHTML='';const el=(tag,cls)=>{const e=document.createElement(tag);e.className=cls;return e};
// botões com ícone + legenda curta; em tela estreita cabem os 6 numa linha
const bt=(ic,tx,fn,cls)=>{const b=el('button','tb'+(cls?' '+cls:''));b.innerHTML='<span>'+ic+'</span><small>'+tx+'</small>';b.setAttribute('aria-label',tx);b.onclick=fn;return b};
const tg=el('div','tg');[['fill','🪣','Balde'],['pen','✏️','Lápis'],['era','🧽','Borracha']].forEach(([k,ic,tx])=>tg.appendChild(bt(ic,tx,()=>{tool=k;tools()},tool===k?'on':'')));
tg.appendChild(bt('↩️','Desfazer',undo));tg.appendChild(bt('🗑️','Limpar',()=>{if(!light)return;snap();cx.clearRect(0,0,W,H);ops.push({t:'c'});save()}));const s=bt('💾','Salvar',saveImg,'ok');s.setAttribute('aria-label','Salvar na galeria do aparelho');tg.appendChild(s);t.appendChild(tg);
const pal=el('div','pal');COLORS.forEach(c=>{const b=el('button','sw'+(c===col&&tool!=='era'?' on':''));b.style.background=c;b.setAttribute('aria-label','Cor '+c);b.onclick=()=>{col=c;if(tool==='era'||tool==='move')tool='fill';tools()};pal.appendChild(b)});t.appendChild(pal);
const sz=el('label','sz');sz.innerHTML='<span>Espessura</span><input type="range" aria-label="Espessura" min="2" max="80" value="'+size+'"><i></i>';const rg=sz.querySelector('input'),pv=sz.querySelector('i');const up=()=>{size=+rg.value;const d=Math.max(4,Math.min(32,size/2+2));pv.style.width=pv.style.height=d+'px';pv.style.background=tool==='era'?'#bbb':col};rg.oninput=up;up();t.appendChild(sz);
t.insertAdjacentHTML('beforeend','<p class="gire">🔄 Vire o celular para o desenho ficar maior</p>');zAplica()}
let cur=0;
async function openColor(i){flush();from=$('gal').classList.contains('hide')?'home':'gal';cur=i;show('color','🎨 '+NAMES[i]);if(tool==='move')tool='fill';zi=0;ox=oy=0;zAplica();tools();cc.width=W;cc.height=H;cx.clearRect(0,0,W,H);$('lo').src=IMG.c(i);hist=[];ops=[];light=null;
const [B,r]=await Promise.all([loadBits(IMG.m(i),W*H),dbGet(i)]);if(cur!==i)return;const L=areas(B);if(r&&r.ops){ops=r.ops;replay(cx,L,ops)}light=L}
async function saveImg(){const o=document.createElement('canvas');o.width=W;o.height=H;const q=o.getContext('2d');q.fillStyle='#fff';q.fillRect(0,0,W,H);q.drawImage(cc,0,0);q.drawImage($('lo'),0,0,W,H);
const name='garagem-da-diversao-'+NAMES[cur].toLowerCase().replace(/\s+/g,'-')+'.png';
const blob=await new Promise(r=>o.toBlob(r,'image/png'));
const f=new File([blob],name,{type:'image/png'});
if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'Meu desenho'});win('Desenho salvo!',false);return}catch(e){if(e&&e.name==='AbortError')return}}
try{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);win('Desenho salvo!',false)}catch(e){fb(o)}}
function fb(o){const v=document.createElement('div');v.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;color:#fff;text-align:center';v.innerHTML='<div style="font-size:18px;font-weight:700">Segure o dedo na imagem e escolha "Salvar na galeria"</div><img src="'+o.toDataURL('image/png')+'" style="max-width:100%;max-height:70%;background:#fff;border-radius:12px;-webkit-user-select:auto;user-select:auto"><button style="background:#e3b83b;border:0;border-radius:20px;padding:10px 22px;font:inherit;font-size:17px">Fechar</button>';v.querySelector('button').onclick=()=>v.remove();document.body.appendChild(v)}
function snap(){const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(cc,0,0);hist.push(c);if(hist.length>12)hist.shift()}
function undo(){const h=hist.pop();if(h){cx.clearRect(0,0,W,H);cx.drawImage(h,0,0);ops.pop();save()}}
function pos(e){const r=cc.getBoundingClientRect();return[Math.floor((e.clientX-r.left)*W/r.width),Math.floor((e.clientY-r.top)*H/r.height)]}
function rgb(h){return[1,3,5].map(i=>parseInt(h.substr(i,2),16))}
// rotula uma vez as áreas pintáveis da máscara (mesma vizinhança do balde) e guarda o retângulo de cada uma
function areas(B){const lab=new Int32Array(W*H),box=[null],st=new Int32Array(W*H);let n=0;
for(let s=0;s<W*H;s++){if(!B[s]||lab[s])continue;n++;let sp=0,x0=W,x1=0,y0=H,y1=0;st[sp++]=s;lab[s]=n;
while(sp){const i=st[--sp],px=i%W,py=(i-px)/W;if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;if(px>0&&B[i-1]&&!lab[i-1]){lab[i-1]=n;st[sp++]=i-1}if(px<W-1&&B[i+1]&&!lab[i+1]){lab[i+1]=n;st[sp++]=i+1}if(i>=W&&B[i-W]&&!lab[i-W]){lab[i-W]=n;st[sp++]=i-W}if(i<W*H-W&&B[i+W]&&!lab[i+W]){lab[i+W]=n;st[sp++]=i+W}}
box.push([x0,y0,x1,y1])}return{lab,box}}
// balde: pinta a área tocada e alarga 2px para entrar por baixo do traço; trabalha só no retângulo da área
function paintFill(g,A,x,y,c){if(x<0||y<0||x>=W||y>=H)return false;const k=A.lab[y*W+x];if(!k)return false;
let [x0,y0,x1,y1]=A.box[k];x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(W-1,x1+2);y1=Math.min(H-1,y1+2);const bw=x1-x0+1,bh=y1-y0+1,N=bw*bh;let m=new Uint8Array(N);
for(let yy=0;yy<bh;yy++){const r=(yy+y0)*W+x0;for(let xx=0;xx<bw;xx++)if(A.lab[r+xx]===k)m[yy*bw+xx]=1}
for(let r=0;r<2;r++){const n=m.slice();for(let i=0;i<N;i++)if(m[i]){const px=i%bw;if(px>0)n[i-1]=1;if(px<bw-1)n[i+1]=1;if(i>=bw)n[i-bw]=1;if(i<N-bw)n[i+bw]=1}m=n}
const d=g.createImageData(bw,bh),p=d.data,[R,G,B]=rgb(c);for(let i=0;i<N;i++)if(m[i]){p[i*4]=R;p[i*4+1]=G;p[i*4+2]=B;p[i*4+3]=255}
const tc=document.createElement('canvas');tc.width=bw;tc.height=bh;tc.getContext('2d').putImageData(d,0,0);g.drawImage(tc,x0,y0);return true}
function fill(x,y){if(!light||x<0||y<0||x>=W||y>=H||!light.lab[y*W+x])return;snap();paintFill(cx,light,x,y,col);ops.push({t:'f',x,y,c:col});save()}
function stroke(a,b){cx.globalCompositeOperation=tool==='era'?'destination-out':'source-over';cx.strokeStyle=col;cx.lineWidth=size;cx.lineCap=cx.lineJoin='round';cx.beginPath();cx.moveTo(a[0],a[1]);cx.lineTo(b[0],b[1]);cx.stroke();cx.globalCompositeOperation='source-over'}
// redesenha a lista de ações salva (a partir do último "limpar"); traço em segmentos, igual ao desenho ao vivo.
// Balde repetido na mesma área: só o último conta (cobre exatamente os mesmos pixels), os anteriores são pulados.
function replay(g,L,o){o=live(o);const at=a=>a.x>=0&&a.y>=0&&a.x<W&&a.y<H?L.lab[a.y*W+a.x]:0,ult=new Map();o.forEach((a,k)=>{if(a.t==='f')ult.set(at(a),k)});
for(let k=0;k<o.length;k++){const a=o[k];if(a.t==='f'){if(ult.get(at(a))===k)paintFill(g,L,a.x,a.y,a.c)}else if(a.t==='s'){const p=a.p;g.globalCompositeOperation=a.e?'destination-out':'source-over';g.strokeStyle=a.c;g.lineWidth=a.w;g.lineCap=g.lineJoin='round';const seg=(x0,y0,x1,y1)=>{g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke()};seg(p[0],p[1],p[0]+.1,p[1]);for(let k=2;k<p.length;k+=2)seg(p[k-2],p[k-1],p[k],p[k+1]);g.globalCompositeOperation='source-over'}}}
const cw=$('cw');
/* ---------- ZOOM: botões + e −; com zoom, ✋ arrasta o desenho ----------
   Só muda a transformação de #cz (deslocamento o em frações da janela, o ∈ [0, z−1]). pos() usa o tamanho real
   do canvas na tela, então balde e lápis continuam acertando o ponto em qualquer zoom. */
const ZN=[1,1.5,2,3,4];let zi=0,ox=0,oy=0,pan=null;
function zAplica(){const z=ZN[zi];ox=Math.min(Math.max(ox,0),z-1);oy=Math.min(Math.max(oy,0),z-1);
$('cz').style.transform=z===1?'':'translate('+(-ox*100)+'%,'+(-oy*100)+'%) scale('+z+')';
$('zlv').textContent=String(z).replace('.',',')+'×';$('zout').disabled=zi===0;$('zin').disabled=zi===ZN.length-1;
$('zmv').classList.toggle('hide',zi===0);$('zmv').classList.toggle('on',tool==='move');cw.classList.toggle('mover',tool==='move')}
function zMuda(d){const z0=ZN[zi];zi=Math.min(Math.max(zi+d,0),ZN.length-1);const z=ZN[zi];   // amplia em volta do centro da janela
ox=(.5+ox)/z0*z-.5;oy=(.5+oy)/z0*z-.5;if(zi===0&&tool==='move'){tool='fill';tools()}zAplica()}
$('zin').onclick=()=>zMuda(1);$('zout').onclick=()=>zMuda(-1);
cw.addEventListener('scroll',()=>{cw.scrollLeft=cw.scrollTop=0});   // navegadores sem overflow:clip rolam a janela ao focar botão
$('zmv').onclick=()=>{tool=tool==='move'?'fill':'move';tools();zAplica()};
cw.addEventListener('pointerdown',e=>{if(e.target.closest('.zoom'))return;
if(tool==='move'){pan={x:e.clientX,y:e.clientY,ox,oy};cw.setPointerCapture(e.pointerId);return}
if(!light)return;const p=pos(e);if(tool==='fill'){fill(p[0],p[1]);return}snap();drawing=true;lp=p;stroke(p,[p[0]+.1,p[1]]);sop={t:'s',c:col,w:size,e:tool==='era'?1:0,p:[p[0],p[1]]};ops.push(sop);cw.setPointerCapture(e.pointerId)});
cw.addEventListener('pointermove',e=>{if(pan){ox=pan.ox-(e.clientX-pan.x)/cw.clientWidth;oy=pan.oy-(e.clientY-pan.y)/cw.clientHeight;zAplica();return}
if(!drawing)return;const p=pos(e);stroke(lp,p);lp=p;sop.p.push(p[0],p[1])});
['pointerup','pointercancel'].forEach(k=>cw.addEventListener(k,()=>{pan=null;if(drawing){drawing=false;save()}}));
/* ---------- MEUS DESENHOS ---------- */
async function openGal(){show('gal','🖼️ Meus desenhos');const g=$('gg');g.innerHTML='';let n=0;const fila=[];
for(let i=0;i<NAMES.length;i++){const r=await dbGet(i);if(!r||!r.ops||!r.ops.length)continue;n++;
const b=document.createElement('div');b.className='card';const th=document.createElement('canvas');th.width=393;th.height=277;b.appendChild(th);
b.insertAdjacentHTML('beforeend','<span>'+NAMES[i]+'</span><small>'+new Date(r.t).toLocaleDateString('pt-BR')+'</small><button class="del" aria-label="Apagar">🗑️</button>');
b.onclick=e=>{if(e.target.classList.contains('del')){if(confirm('Apagar o desenho do '+NAMES[i]+'?'))dbDel(i).then(openGal);return}openColor(i)};g.appendChild(b);fila.push([i,r.ops,th])}
$('ge').classList.toggle('hide',n>0);for(const a of fila)await thumb(...a)}
async function thumb(i,o,th){const [B,im]=await Promise.all([loadBits(IMG.m(i),W*H),new Promise(ok=>{const m=new Image();m.onload=()=>ok(m);m.onerror=()=>ok(null);m.src=IMG.c(i)})]);
const off=document.createElement('canvas');off.width=W;off.height=H;replay(off.getContext('2d'),areas(B),o);const t=th.getContext('2d');t.fillStyle='#fff';t.fillRect(0,0,th.width,th.height);t.drawImage(off,0,0,th.width,th.height);if(im)t.drawImage(im,0,0,th.width,th.height)}
$('bgal').onclick=openGal;
/* ---------- JOGOS ---------- */
const G=$('game');
function ptr(el,e){const r=el.getBoundingClientRect(),v=el.viewBox&&el.viewBox.baseVal;return[(e.clientX-r.left)*(v?v.width:el.width)/r.width,(e.clientY-r.top)*(v?v.height:el.height)/r.height]}
/* ligar pontos */
const PT=[[81,400],[98,381],[121,371],[143,365],[170,360],[174,347],[190,344],[208,329],[225,313],[245,298],[268,285],[292,279],[316,279],[334,279],[358,277],[378,277],[397,277],[419,277],[443,273],[458,240],[459,266],[478,274],[494,278],[511,288],[528,307],[538,327],[561,335],[582,335],[605,344],[599,378],[598,400],[597,421],[597,445],[596,463],[593,487],[588,508],[559,518],[516,518],[507,485],[481,491],[456,496],[430,501],[410,518],[403,541],[380,563],[351,568],[323,565],[298,553],[285,534],[255,537],[232,532],[203,529],[171,524],[156,547],[133,553],[107,552],[82,537],[71,512],[69,494],[65,467],[67,441],[71,417]].map(p=>[p[0]-45+10,p[1]-225+10]);
function gDots(){show('game','🔵 Ligue os pontos');let n=0;
G.innerHTML='<p class="h">Toque nos pontos na ordem certa: 1, 2, 3… e descubra o carro misterioso!</p><div class="box"><svg id="sv" viewBox="0 0 600 375" width="100%"><image id="tr" href="'+IMG.truck+'" x="10" y="10" width="580" height="355" opacity="0" style="transition:opacity 1s"/><g id="ln"></g><g id="dt"></g><text id="nm" x="300" y="360" text-anchor="middle" font-size="56" fill="#2575bb" opacity="0">MONTANA</text></svg></div>';
const dt=$('dt'),ln=$('ln'),cxm=PT.reduce((a,p)=>a+p[0],0)/PT.length,cym=PT.reduce((a,p)=>a+p[1],0)/PT.length;
PT.forEach((p,i)=>{const g=document.createElementNS('http://www.w3.org/2000/svg','g');const dx=p[0]-cxm,dy=p[1]-cym,l=Math.hypot(dx,dy)||1;
g.innerHTML='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="9" fill="#2575bb" stroke="#fff" stroke-width="2"/><text x="'+(p[0]+dx/l*18)+'" y="'+(p[1]+dy/l*18+5)+'" text-anchor="middle" font-size="14" fill="#12324f">'+(i+1)+'</text>';
g.style.cursor='pointer';g.onclick=()=>{if(i!==n){g.classList.remove('sh');void g.getBoundingClientRect();g.classList.add('sh');return}
g.firstChild.setAttribute('fill','#7bd88f');if(n>0)add(PT[n-1],p);n++;if(n<PT.length)somAcerto();if(n===PT.length){add(p,PT[0]);$('tr').setAttribute('opacity','1');$('nm').setAttribute('opacity','1');win('É a Montana!')}else nxt()};dt.appendChild(g)});
function add(a,b){const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',a[0]);l.setAttribute('y1',a[1]);l.setAttribute('x2',b[0]);l.setAttribute('y2',b[1]);l.setAttribute('stroke','#e33');l.setAttribute('stroke-width','3');ln.appendChild(l)}
function nxt(){dt.querySelectorAll('circle').forEach((c,i)=>c.classList.toggle('nx',i===n))}nxt()}
/* caça-palavras */
const GRID=['FACESSÓRIOS','ECENTENÁRIO','RCHEVROLETO','RTAZBCNBAVN','AGCOFICINAS','MFDRUZBARWT','EUEWDPEÇASA','NTLNUHICPTR','TUCJRHZAYWZ','AROPHLPILHR','SOTZJTEOQJC','REVISÃOCPHE'];
const WORDS=['OFICINA','PEÇAS','CHEVROLET','ACDELCO','REVISÃO','FERRAMENTAS','ACESSÓRIOS','CENTENÁRIO','ONSTAR','FUTURO'];
const nrm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function gWS(){show('game','🔤 Caça-palavras');G.innerHTML='<p class="h">Arraste o dedo sobre as letras para marcar cada palavra (na horizontal, vertical ou diagonal).</p><div class="box" style="line-height:1"><div id="ws"></div><div id="wl"></div></div>';
const ws=$('ws'),cells=[],found=new Set();
GRID.forEach((r,y)=>[...r].forEach((ch,x)=>{const d=document.createElement('div');d.textContent=ch;d.dataset.x=x;d.dataset.y=y;ws.appendChild(d);cells.push(d)}));
WORDS.forEach(w=>{const s=document.createElement('span');s.textContent=w;s.id='w'+nrm(w);$('wl').appendChild(s)});
let a=null,sel=[];
const cellAt=e=>{const el=document.elementFromPoint(e.clientX,e.clientY);return el&&el.parentNode===ws?el:null};
const line=(a,b)=>{const dx=+b.dataset.x-+a.dataset.x,dy=+b.dataset.y-+a.dataset.y;if(dx&&dy&&Math.abs(dx)!==Math.abs(dy))return[a];const n=Math.max(Math.abs(dx),Math.abs(dy)),sx=Math.sign(dx),sy=Math.sign(dy),o=[];for(let i=0;i<=n;i++)o.push(cells[(+a.dataset.y+sy*i)*11+(+a.dataset.x+sx*i)]);return o};
ws.addEventListener('pointerdown',e=>{const c=cellAt(e);if(!c)return;a=c;sel=[c];c.classList.add('s');ws.setPointerCapture(e.pointerId)});
ws.addEventListener('pointermove',e=>{if(!a)return;const c=cellAt(e);if(!c)return;sel.forEach(x=>x.classList.remove('s'));sel=line(a,c);sel.forEach(x=>x.classList.add('s'))});
ws.addEventListener('pointerup',()=>{if(!a)return;const t=sel.map(c=>nrm(c.textContent)).join(''),r=[...t].reverse().join('');const w=WORDS.find(w=>!found.has(w)&&(nrm(w)===t||nrm(w)===r));sel.forEach(x=>x.classList.remove('s'));if(w){found.add(w);sel.forEach(x=>x.classList.add('f'));$('w'+nrm(w)).classList.add('f');if(found.size===WORDS.length)win('Achou todas!');else somAcerto()}a=null;sel=[]})}
/* labirinto */
function gMaze(){show('game','🌀 Labirinto');G.innerHTML='<p class="h">Leve o carro até a concessionária sem encostar nas paredes! Comece pelo carro e arraste o dedo.</p><div class="box"><canvas id="mz" style="width:100%;touch-action:none"></canvas></div>';
const c=$('mz'),x=c.getContext('2d'),im=new Image();let L,w,h,on=false,lp,path=[];
im.onload=async()=>{w=c.width=im.width;h=c.height=im.height;x.drawImage(im,0,0);L=await loadBits(IMG.mm,w*h);draw()};im.src=IMG.maze;
const draw=()=>{x.clearRect(0,0,w,h);x.drawImage(im,0,0);x.fillStyle='rgba(227,51,51,.25)';x.fillRect(320,0,155,75);x.strokeStyle='#e33';x.lineWidth=7;x.lineCap=x.lineJoin='round';x.beginPath();path.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke()};
const P=e=>ptr(c,e),wall=p=>!(p[0]>322&&p[1]<75)&&L[Math.round(p[1])*w+Math.round(p[0])]===1;
c.onpointerdown=e=>{const p=P(e);if(p[0]>320&&p[1]<80){on=true;path=[p];lp=p;c.setPointerCapture(e.pointerId)}};
c.onpointermove=e=>{if(!on)return;const p=P(e),n=Math.ceil(Math.hypot(p[0]-lp[0],p[1]-lp[1])/2);for(let i=1;i<=n;i++){const q=[lp[0]+(p[0]-lp[0])*i/n,lp[1]+(p[1]-lp[1])*i/n];if(q[0]<0||q[1]<0||q[0]>=w||q[1]>=h)continue;if(wall(q)){on=false;path=[];draw();c.classList.remove('sh');void c.offsetWidth;c.classList.add('sh');return}path.push(q)}lp=p;draw();if(p[0]<190&&p[1]>470){on=false;win('Chegou na oficina!')}};
c.onpointerup=()=>{on=false}}
/* ligar peças */
function gMatch(){show('game','🔧 Peças ACDelco');const Ls=[[105,55],[105,195],[85,320],[105,445],[110,575]],Rs=[[370,52],[370,165],[360,300],[370,430],[370,565]],ans=[3,4,1,0,2];let sl=null,done=0;
G.innerHTML='<p class="h">Toque no nome/figura da esquerda e depois na peça escura certa da direita.</p><div class="box"><svg id="mt" viewBox="0 0 500 650" width="100%" style="max-width:520px;display:block;margin:auto"><image href="'+IMG.acd+'" width="500" height="650"/><g id="ml"></g><g id="mh"></g></svg></div>';
const mh=$('mh'),ml=$('ml'),ns='http://www.w3.org/2000/svg';const used=new Set();
function hot(p,w,cb){const r=document.createElementNS(ns,'rect');r.setAttribute('x',p[0]-w/2);r.setAttribute('y',p[1]-50);r.setAttribute('width',w);r.setAttribute('height',100);r.setAttribute('rx',14);r.setAttribute('fill','rgba(37,117,187,.08)');r.setAttribute('stroke','#2575bb');r.setAttribute('stroke-dasharray','6');r.style.cursor='pointer';r.onclick=()=>cb(r);mh.appendChild(r);return r}
const lr=Ls.map((p,i)=>hot([p[0]+10,p[1]+20],170,r=>{if(used.has(i))return;lr.forEach(q=>q.setAttribute('fill','rgba(37,117,187,.08)'));r.setAttribute('fill','rgba(227,184,59,.5)');sl=i}));
Rs.forEach((p,j)=>hot([p[0],p[1]],150,r=>{if(sl===null)return;if(ans[sl]===j&&!used.has(sl)){used.add(sl);const l=document.createElementNS(ns,'line');l.setAttribute('x1',190);l.setAttribute('y1',Ls[sl][1]+20);l.setAttribute('x2',p[0]-70);l.setAttribute('y2',p[1]);l.setAttribute('stroke','#2e9e4f');l.setAttribute('stroke-width','5');l.setAttribute('stroke-linecap','round');ml.appendChild(l);lr[sl].setAttribute('fill','rgba(123,216,143,.5)');r.setAttribute('fill','rgba(123,216,143,.5)');sl=null;if(used.size===5)win('Tudo certo!');else somAcerto()}else{r.classList.remove('sh');void r.getBoundingClientRect();r.classList.add('sh')}}))}
/* ---------- CADASTRO DO RESPONSÁVEL (Google Planilha via Apps Script) ----------
   Pedido uma vez por aparelho, antes de usar o app (se CADASTRO.ativo). Fica guardado no aparelho e é enviado à
   planilha; sem internet (ou se o envio falhar) a criança já pode brincar e o envio é tentado de novo ao abrir o app
   e quando a conexão volta. O script da planilha valida e ignora reenvios (ver tools/planilha/Codigo.gs). */
const AVISO_VERSAO='2026-10-v1';
const LS={get:k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const soDig=s=>s.replace(/\D/g,'');
const fmtCel=s=>{const d=soDig(s).slice(0,11);if(d.length<=2)return d.length?'('+d:'';if(d.length<=7)return '('+d.slice(0,2)+') '+d.slice(2);return '('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7)};
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
let enviando=false;
async function enviarCadastro(){const c=LS.get('cadastro'),K=window.CADASTRO||{};if(!c||c.enviado||enviando||!K.planilha)return;enviando=true;
// corpo em text/plain: o Apps Script não aceita a pré-checagem (CORS) que um JSON com cabeçalhos dispararia
// só marca como enviado com a confirmação {"ok":true} da planilha; qualquer falha fica pendente e tenta de novo depois
try{const j=await (await fetch(K.planilha,{method:'POST',body:JSON.stringify({...c.dados,token:K.token})})).json();if(j.ok){c.enviado=true;LS.set('cadastro',c)}}
catch(e){}finally{enviando=false}}
function avisoPrivacidade(){const P=window.PRIVACIDADE||{},ct=P.contato?' pelo contato <b>'+P.contato+'</b>':' com o Grupo Automec';
$('privtxt').innerHTML='<p>O Grupo Automec usa o nome, e-mail e celular informados para saber quem utiliza a Garagem da Diversão e, só se você marcar a opção de novidades, para enviar ofertas e novidades. Os dados não são vendidos. Os desenhos das crianças ficam apenas neste aparelho e não são enviados.</p><p>Você pode pedir para ver, corrigir ou apagar seus dados'+ct+'.</p>'+(P.link?'<p><a href="'+P.link+'" target="_blank" rel="noopener">Política de privacidade completa</a></p>':'')}
function abrirCadastro(){show('cad','👋 Olá!');avisoPrivacidade()}
$('lpriv').onclick=e=>{e.preventDefault();$('priv').open=true;$('priv').scrollIntoView({behavior:'smooth',block:'center'})};
$('ct').addEventListener('input',e=>{e.target.value=fmtCel(e.target.value)});
$('fcad').addEventListener('submit',e=>{e.preventDefault();
const nome=$('cn').value.trim().replace(/\s+/g,' '),email=$('ce').value.trim().toLowerCase(),cel=soDig($('ct').value);
const erros={cn:nome.length<3||!nome.includes(' ')?'Escreva o nome e o sobrenome.':'',ce:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)?'':'Confira o e-mail.',
ct:/^\d{2}9\d{8}$/.test(cel)?'':'Digite o celular com DDD, ex.: (51) 99999-9999.',ca:$('ca').checked?'':'Para continuar, marque que você é o responsável e concorda.'};
let pri=null;for(const k in erros){$(k+'-e').textContent=erros[k];$(k).setAttribute('aria-invalid',erros[k]?'true':'false');if(erros[k]&&!pri)pri=k}
if(pri){$(pri).focus();return}
LS.set('cadastro',{enviado:false,dados:{id:uuid(),nome,email,celular:cel,aceite_termos:true,aceite_novidades:$('cm').checked,versao_aviso:AVISO_VERSAO,criado_em_aparelho:new Date().toISOString()}});
if(!LS.get('cadastro')){alert('Este navegador está bloqueando o armazenamento. Saia do modo anônimo para salvar o cadastro.')}
enviarCadastro();show('home');win('Bem-vindo à Garagem!')});
addEventListener('online',enviarCadastro);
if((window.CADASTRO||{}).ativo){if(LS.get('cadastro'))enviarCadastro();else abrirCadastro()}
