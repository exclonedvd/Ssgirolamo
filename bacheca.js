/* Bacheca FREE — nessuna API a pagamento */
const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

// ----- SCROLLER (consigli curati) -----
function buildScroller(items){
  const list = $('#scroller-list');
  list.innerHTML = '';

  // crea li (due volte per loop infinito)
  const makeNodes = () => items.map(it => {
    const li = document.createElement('li');
    li.className = 'tag';
    li.title = it.title;
    if(it.kind==='vedere') li.classList.add('vedere');
    if(it.kind==='provare') li.classList.add('provare');
    if(it.kind==='escursioni') li.classList.add('escursioni');

    const a = document.createElement('a');
    a.href = it.maps || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(it.title + ' Mantova'));
    a.target = '_blank'; a.rel = 'noopener nofollow ugc';
    a.textContent = it.title;
    li.appendChild(a);
    return li;
  });

  const nodes = makeNodes();
  nodes.concat(makeNodes()).forEach(n => list.appendChild(n));

  // calcola durata in base alla larghezza totale (velocità ~ 90px/s)
  requestAnimationFrame(() => {
    const totalWidth = list.scrollWidth/2; // metà, perché duplicato
    const speed = 90; // px/sec
    const dur = Math.max(20, Math.round(totalWidth / speed));
    list.style.setProperty('--to', `-${totalWidth}px`);
    list.style.animation = `autoscroll ${dur}s linear infinite`;
  });
}

// ----- BOARD locale (consigli moderati manualmente) -----
const state = { tips: Array.isArray(window.BACHECA_COMMUNITY||[]) ? window.BACHECA_COMMUNITY : [], q:'', cat:'', sort:'newest' };

function fmtDate(iso){
  try{ const d = new Date(iso); return d.toLocaleDateString('it-IT',{year:'numeric',month:'short',day:'2-digit'}) }catch(e){ return '' }
}

function renderBoard(){
  const list = $('#tips');
  const template = $('#tip-template');
  list.innerHTML = '';
  let items = state.tips.slice();

  if(state.q){
    const q = state.q.toLowerCase();
    items = items.filter(t =>
      (t.consiglio||'').toLowerCase().includes(q) ||
      (t.luogo||'').toLowerCase().includes(q) ||
      (t.nome||'').toLowerCase().includes(q)
    );
  }
  if(state.cat){ items = items.filter(t => (t.categoria||'')===state.cat); }

  if(state.sort==='newest'){
    items.sort((a,b)=> new Date(b.created_at||0)-new Date(a.created_at||0));
  }else{
    items.sort((a,b)=> (a.luogo||'').localeCompare(b.luogo||'', 'it', {sensitivity:'base'}));
  }

  $('#empty').hidden = items.length !== 0;

  for(const t of items){
    const node = template.content.cloneNode(true);
    $('.cat', node).textContent = t.categoria || 'Consiglio';
    const when = t.created_at || t.inserito_il || new Date().toISOString();
    const timeEl = $('.when', node);
    timeEl.textContent = fmtDate(when);
    timeEl.setAttribute('datetime', when);
    $('.place', node).textContent = t.luogo || 'Mantova';
    $('.text', node).textContent = t.consiglio || '';
    $('.author', node).textContent = t.nome ? `da ${t.nome}` : 'ospite anonimo';
    const mapA = $('.map', node);
    if(t.link){
      mapA.href = t.link; mapA.hidden = false;
    }else if(t.luogo){
      mapA.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.luogo + ' Mantova')}`;
      mapA.hidden = false;
    }else{ mapA.hidden = true; }
    list.appendChild(node);
  }
}

function init(){
  $('#year').textContent = new Date().getFullYear();
  // scroller
  buildScroller(window.BACHECA_LIST || []);
  // board
  $('#search').addEventListener('input', e=>{ state.q = e.target.value.trim(); renderBoard(); });
  $('#filter-category').addEventListener('change', e=>{ state.cat = e.target.value; renderBoard(); });
  $('#sort').addEventListener('change', e=>{ state.sort = e.target.value; renderBoard(); });
  renderBoard();
}

document.addEventListener('DOMContentLoaded', init);
