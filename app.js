// Drawer toggle
const drawer = document.getElementById('drawer');
const btn = document.getElementById('menuBtn');
const links = drawer.querySelectorAll('a');
btn.addEventListener('click', ()=>{
  const open = drawer.classList.toggle('open');
  drawer.setAttribute('aria-hidden', String(!open));
  btn.setAttribute('aria-expanded', String(open));
});
links.forEach(a=>a.addEventListener('click', ()=>{
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  btn.setAttribute('aria-expanded', 'false');
}));

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){
      e.preventDefault();
      el.scrollIntoView({behavior:'smooth'});
      history.pushState(null, '', '#'+id);
    }
  });
});

// Gallery loader
async function loadGallery(){
  const box = document.getElementById('gallery');
  if(!box || box.dataset.populated==='1') return;
  box.dataset.populated='1';
  try{
    const res = await fetch('assets/gallery.json');
    const data = await res.json();
    const box = document.getElementById('gallery');
    (data.images || []).forEach(src=>{
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      const base = src.startsWith('assets/') ? src : ('assets/gallery/' + src);
      const ext = base.split('.').pop();
      const baseNoExt = base.slice(0, -(ext.length+1));
      img.src = base;
      img.srcset = `${baseNoExt}-480.jpg 480w, ${baseNoExt}-800.jpg 800w, ${base} 1280w`;
      img.sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
      img.alt = 'Foto galleria';
      img.addEventListener('load', ()=>{ if(img.naturalWidth&&img.naturalHeight){ img.setAttribute('width', img.naturalWidth); img.setAttribute('height', img.naturalHeight);} });
      box.appendChild(img);
    });
  }catch(e){ console.warn('Galleria non disponibile', e); }
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', ()=>{ if(!window.CSGallery){ loadGallery(); } }, {once:true});
}else{
  if(!window.CSGallery){ loadGallery(); }
}

// PWA
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(console.error);
  });
}

// Install prompt (optional UX)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.createElement('button');
  btn.className = 'btn outline';
  btn.textContent = 'Installa App';
  btn.style.position='fixed'; btn.style.bottom='16px'; btn.style.right='16px';
  btn.addEventListener('click', async ()=>{
    btn.remove();
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
  document.body.appendChild(btn);
});

// --- I18N ---
const I18N = {
  t(key){ try{ return (this.data?.[this.lang]?.[key]) || (this.data?.it?.[key]) || key; }catch(e){ return key; } },
  data: null,
  lang: (localStorage.getItem('lang') || 'it'),
  async load(){
    if(this.data) return this.data;
    const res = await fetch('assets/i18n.json');
    this.data = await res.json();
    return this.data;
  },
  async apply(lang){
    await this.load();
    this.lang = lang;
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      const txt = this.data?.[lang]?.[key];
      if(typeof txt === 'string') el.textContent = txt;
    });
    // Update drawer links text (already covered by [data-i18n])
    // Update placeholders (optional)
  }
};
(async()=>{
  await I18N.load();
  await I18N.apply(I18N.lang);
  // set active button
  document.querySelectorAll('#langSwitch button').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang===I18N.lang);
    b.addEventListener('click', async ()=>{
      document.querySelectorAll('#langSwitch button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      await I18N.apply(b.dataset.lang);
    });
  });
})();

// --- Lightbox ---
(function(){
  const galleryBox = document.getElementById('gallery');
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const closeBtn = document.getElementById('lbClose');
  const prevBtn = document.getElementById('lbPrev');
  const nextBtn = document.getElementById('lbNext');
  let images = [];
  let idx = 0;

  window.openLightbox = function open(i){
    idx = i;
    lbImg.src = images[idx].src;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
  }
  window.closeLightbox = function close(){
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
  }
  function prev(){ idx = (idx - 1 + images.length) % images.length; lbImg.src = images[idx].src; }
  function next(){ idx = (idx + 1) % images.length; lbImg.src = images[idx].src; }

  if(galleryBox){
    const obs = new MutationObserver(()=>{
      images = Array.from(galleryBox.querySelectorAll('img'));
      images.forEach((img,i)=>{
        if(!img.dataset.lb){
          img.dataset.lb = '1';
          img.style.cursor = 'zoom-in';
          img.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); open(i); });
          img.addEventListener('keydown', (e)=>{
            if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(i); }
          });
        }
      });
    });
    obs.observe(galleryBox, {childList:true});
    // Prevent accidental navigation inside gallery (e.g., if images are wrapped)
    galleryBox.addEventListener('click', (e)=>{
      const a = e.target.closest('a');
      if(a && galleryBox.contains(a)) e.preventDefault();
    });
  }

  closeBtn?.addEventListener('click', window.closeLightbox);
  lb?.addEventListener('click', (e)=>{ if(e.target===lb) window.closeLightbox(); });
  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);
  document.addEventListener('keydown', (e)=>{
    if(!lb.classList.contains('open')) return;
    if(e.key==='Escape') window.closeLightbox();
    if(e.key==='ArrowLeft') prev();
    if(e.key==='ArrowRight') next();
  });
})();


// --- Mini galleries (under Esperienze) ---
(function(){
  const MINI = {
    degustazioni: [ 'assets/esperienze/degustazioni/degustazioni-1.jpg',
      'assets/esperienze/degustazioni/degustazioni-2.jpg',
      'assets/esperienze/degustazioni/degustazioni-3.jpg',
      'assets/esperienze/degustazioni/degustazioni-4.jpg' ],
    colazione: [ 'assets/esperienze/colazione/colazione-1.jpg',
      'assets/esperienze/colazione/colazione-2.jpg',
      'assets/esperienze/colazione/colazione-3.jpg',
      'assets/esperienze/colazione/colazione-4.jpg' ],
    apicoltura: [ 'assets/esperienze/apicoltura/apicoltura-1.jpg',
      'assets/esperienze/apicoltura/apicoltura-2.jpg',
      'assets/esperienze/apicoltura/apicoltura-3.jpg',
      'assets/esperienze/apicoltura/apicoltura-4.jpg' ],
    orto: [ 'assets/esperienze/orto/orto-1.jpg',
      'assets/esperienze/orto/orto-2.jpg',
      'assets/esperienze/orto/orto-3.jpg',
      'assets/esperienze/orto/orto-4.jpg' ],
    massaggi: [ 'assets/esperienze/massaggi/massaggi-1.jpg',
      'assets/esperienze/massaggi/massaggi-2.jpg',
      'assets/esperienze/massaggi/massaggi-3.jpg',
      'assets/esperienze/massaggi/massaggi-4.jpg' ]
  };

  function buildMini(id, list){
    const box = document.getElementById(id);
    if(!box) return;
    const isClickable = (box.dataset && (box.dataset.clickable === '1' || box.getAttribute('data-clickable') === '1'));
    list.slice(0,4).forEach((src)=>{
      const ext = src.split('.').pop();
      const baseNoExt = src.slice(0, -(ext.length+1));
      const img = new Image();
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = baseNoExt + '-480.jpg';
      img.srcset = baseNoExt + '-480.jpg 480w, ' + baseNoExt + '-800.jpg 800w, ' + src + ' 1280w';
      img.sizes = '(max-width: 600px) 40vw, 120px';
      img.alt = '';
      if(isClickable){
        img.addEventListener('click', ()=>{
          // Try to open the main lightbox at the matching index inside #gallery
          const big = src;
          const galleryImages = Array.from(document.querySelectorAll('#gallery img'));
          let index = galleryImages.findIndex(g => (g.currentSrc && g.currentSrc.endsWith(big)) || (g.src && g.src.endsWith(big)));
          if(index >= 0 && typeof window.openLightbox === 'function'){
            window.openLightbox(index);
          }else if(window.CSGallery && typeof window.CSGallery.open === 'function'){
            window.CSGallery.open(index >= 0 ? index : 0);
          }else{
            const lb = document.getElementById('lightbox');
            const lbImg = document.getElementById('lbImg');
            if(lb && lbImg){
              lbImg.src = src;
              lb.classList.add('open');
              lb.setAttribute('aria-hidden', 'false');
            }
          }
        });
      }else{
        img.setAttribute('aria-disabled','true');
        img.setAttribute('tabindex','-1');
        img.draggable = false;
        img.style.cursor = 'default';
      }
    box.appendChild(img);
    });
  }

  function buildMiniGalleries(){
            buildMini('mini-degustazioni', MINI.degustazioni);
buildMini('mini-colazione', MINI.colazione);
buildMini('mini-apicoltura', MINI.apicoltura);
    buildMini('mini-orto', MINI.orto);
    buildMini('mini-massaggi', MINI.massaggi);
  }

  // Run when DOM is ready (script is defer) and after main gallery loads
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', buildMiniGalleries);
  }else{
    buildMiniGalleries();
  }
})();
// --- Forms: Netlify-ready + optional EmailJS ---
const EMAILJS_PUBLIC_KEY = ''; // <-- inserisci la tua public key
const EMAILJS_SERVICE_ID = ''; // <-- inserisci il service id
const EMAILJS_TEMPLATE_ID = ''; // <-- inserisci il template id

async function tryEmailJS(form) {
  if(!window.emailjs || !EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) return false;
  try{
    window.emailjs.init(EMAILJS_PUBLIC_KEY);
    const data = Object.fromEntries(new FormData(form).entries());
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, data);
    return true;
  }catch(e){
    console.warn('EmailJS error', e);
    return false;
  }
}

function handleForm(form, successEl, errorEl){
  form.addEventListener('submit', async (e)=>{
    // If Netlify handles it, let default proceed only when running on Netlify (heuristic)
    const onNetlify = location.host.endsWith('netlify.app') || location.host.endsWith('netlify.com');
    if(onNetlify){ return; } // native Netlify processing

    e.preventDefault();
    successEl.style.display='none'; errorEl.style.display='none';

    // Try EmailJS; fallback to local "success" for test
    const ok = await tryEmailJS(form);
    if(ok){
      form.reset();
      successEl.style.display='block';
    }else{
      // Local fallback: store in localStorage to not lose data
      try{
        const key = 'form_submissions';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push(Object.fromEntries(new FormData(form).entries()));
        localStorage.setItem(key, JSON.stringify(list));
        form.reset();
        successEl.style.display='block';
      }catch(err){
        console.warn(err);
        errorEl.style.display='block';
      }
    }
  });
}

(function(){
  const contactForm = document.querySelector('form[name="contact"]');
  const bookingForm = document.querySelector('form[name="booking"]');
  if(contactForm){
    handleForm(contactForm, document.getElementById('contactSuccess'), document.getElementById('contactError'));
  }
  if(bookingForm){
    handleForm(bookingForm, document.getElementById('bookingSuccess'), document.getElementById('bookingError'));
  }
})();


// A11y: focus trap for lightbox + restore focus
let lbLastFocus = null;
function focusTrap(e){
  if(e.key !== 'Tab') return;
  const focusables = Array.from(document.querySelectorAll('#lightbox button, #lightbox img')).filter(el=>!el.hasAttribute('disabled'));
  if(!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length-1];
  const active = document.activeElement;
  if(e.shiftKey){
    if(active === first){ e.preventDefault(); last.focus(); }
  }else{
    if(active === last){ e.preventDefault(); first.focus(); }
  }
}
(function(){
  const lb = document.getElementById('lightbox');
  const open = window.openLightbox;
  const close = window.closeLightbox;
  // wrap open/close
  window.openLightbox = function(){ lbLastFocus = document.activeElement; open(); document.addEventListener('keydown', focusTrap); document.getElementById('lbClose')?.focus(); }
  window.closeLightbox = function(){ close(); document.removeEventListener('keydown', focusTrap); if(lbLastFocus) lbLastFocus.focus(); }
})();

// Roving tabindex for gallery
(function(){
  const grid = document.getElementById('gallery');
  if(!grid) return;
  grid.addEventListener('keydown', (e)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
    const items = Array.from(grid.querySelectorAll('img'));
    const cols = Math.max(1, Math.floor(grid.getBoundingClientRect().width / items[0].getBoundingClientRect().width));
    const idx = items.indexOf(document.activeElement);
    let next = idx;
    if(e.key==='ArrowRight') next = Math.min(items.length-1, idx+1);
    if(e.key==='ArrowLeft') next = Math.max(0, idx-1);
    if(e.key==='ArrowDown') next = Math.min(items.length-1, idx+cols);
    if(e.key==='ArrowUp') next = Math.max(0, idx-cols);
    if(next!==idx){ items[next].focus(); e.preventDefault(); }
  });
  grid.addEventListener('click', e=>{ if(e.target.tagName==='IMG'){ e.target.focus(); }});
  const imgs = grid.querySelectorAll('img');
  imgs.forEach((img,i)=>{ img.setAttribute('tabindex', i===0?'0':'-1'); });
  grid.addEventListener('focusin', (e)=>{
    if(e.target.tagName==='IMG'){ imgs.forEach(img=>img.setAttribute('tabindex','-1')); e.target.setAttribute('tabindex','0'); }
  });
})();

// QoL: make address paragraph clickable to open Maps (no UI change)
(function(){
  const p = Array.from(document.querySelectorAll('#contatti .card p')).find(el=>/Girolamo, 1/i.test(el.textContent||''));
  if(!p) return;
  p.style.cursor='pointer';
  p.addEventListener('click', ()=>{
    location.href = 'https://www.google.com/maps/dir/?api=1&destination=Str.+S.+Girolamo,+1,+46100+Mantova+MN';
  });
})();


// Open/Close overlay
(function(){
  const openBtn = document.getElementById('eatOpen');
  const overlay = document.getElementById('eatOverlay');
  const closeBtn = document.getElementById('eatClose');
  if(openBtn && overlay && closeBtn){
    openBtn.addEventListener('click', async ()=>{
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden','false');
      setTimeout(initEatMap, 50);
    });
    closeBtn.addEventListener('click', ()=>{
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden','true');
    });
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); }});
  }
})();




// --- Eat List (category-first) ---
async function loadEatData(){ const res = await fetch('assets/eat.json', {cache:'no-store'}); return await res.json(); }
function isApple(){ return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && !window.MSStream; }
function mapUrl(address, label){ const q = encodeURIComponent(address || label || ''); return isApple() ? `https://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`; }
function telHref(num){ return 'tel:' + (num||'').replace(/\s+/g,''); }

(function(){
  let EAT_DATA = null;

  function renderCategories(host){
    host.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
    wrap.style.gap = '12px';

    EAT_DATA.categories.forEach(cat=>{
      const card = document.createElement('div');
      card.className = 'card';
      const h = document.createElement('h3'); h.textContent = I18N.t(cat.name); h.style.margin='8px 0';
      const p = document.createElement('p'); p.className='muted'; p.style.margin='0 0 8px 0'; p.textContent = (I18N.data?.[I18N.lang]?.eat_select_category || 'Seleziona per vedere i ristoranti');
      const btn = document.createElement('a'); btn.href='#'; btn.className='btn'; btn.textContent=(I18N.data?.[I18N.lang]?.open_category || 'Apri categoria'); btn.addEventListener('click', (e)=>{e.preventDefault(); renderCategory(host, cat);}); card.appendChild(h); card.appendChild(p); card.appendChild(btn);
      wrap.appendChild(card);
    });

    host.appendChild(wrap);
  }

  function makeToolbar(host, title, onBack){
    const bar = document.createElement('div');
    bar.style.display='flex'; bar.style.alignItems='center'; bar.style.justifyContent='space-between';
    bar.style.gap='8px'; bar.style.margin='0 0 8px 0';
    const left = document.createElement('div');
    const back = document.createElement('a'); back.href='#'; back.className='btn outline'; back.textContent='← ' + I18N.t('back'); back.addEventListener('click', (e)=>{e.preventDefault(); onBack();});
    left.appendChild(back);
    const h = document.createElement('strong'); h.textContent = title; h.style.fontSize='18px';
    bar.appendChild(left); bar.appendChild(h);
    host.appendChild(bar);
  }

  function renderCategory(host, cat){
    host.innerHTML = '';
    makeToolbar(host, I18N.t(cat.name), ()=>renderCategories(host));

    const box = document.createElement('div');
    box.className = 'card';
    const ul = document.createElement('ul'); ul.style.margin='0'; ul.style.paddingInlineStart='1rem';

    (cat.items||[]).forEach(it=>{
      const li = document.createElement('li'); li.style.margin='0 0 .6rem 0';
      const strong = document.createElement('strong'); strong.textContent = it.name;
      li.appendChild(strong);
      const addr = document.createElement('div'); addr.className='small'; addr.textContent = it.address||'';
      li.appendChild(addr);
      const row = document.createElement('div'); row.style.display='flex'; row.style.flexWrap='wrap'; row.style.gap='8px'; row.style.marginTop='6px';
      if(it.phone){ const aTel = document.createElement('a'); aTel.href = telHref(it.phone); aTel.className='btn'; aTel.textContent = I18N.t('call'); aTel.setAttribute('aria-label',(I18N.data?.[I18N.lang]?.call || 'Chiama ') + it.name); row.appendChild(aTel); }
      const aPref = document.createElement('a'); aPref.href = mapUrl(it.address, it.name); aPref.target='_blank'; aPref.rel='noopener'; aPref.className='btn'; aPref.textContent=(I18N.data?.[I18N.lang]?.open_in_maps || 'Apri in Mappe'); aPref.setAttribute('data-emoji','map');
      const aG = document.createElement('a'); aG.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(it.address || it.name); aG.target='_blank'; aG.rel='noopener'; aG.className='btn'; aG.textContent='Google'; aG.setAttribute('data-emoji','google');
      const aA = document.createElement('a'); aA.href = 'https://maps.apple.com/?q=' + encodeURIComponent(it.address || it.name); aA.target='_blank'; aA.rel='noopener'; aA.className='btn'; aA.textContent='Apple'; aA.setAttribute('data-emoji','apple');
      if(it.website){ const aWeb=document.createElement('a'); aWeb.href=it.website; aWeb.target='_blank'; aWeb.rel='noopener'; aWeb.className='btn outline'; aWeb.textContent='Sito'; aWeb.setAttribute('data-emoji','site'); row.appendChild(aWeb); }
      row.appendChild(aPref); row.appendChild(aG); row.appendChild(aA);
      li.appendChild(row);
      ul.appendChild(li);
    });

    box.appendChild(ul);
    host.appendChild(box);
  }

  async function openEatList(){ const overlay = document.getElementById('eatOverlay'); const closeBtn = document.getElementById('eatClose');
    const listHost = document.getElementById('eatList');
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false');
    listHost.innerHTML = '<div class="muted">Caricamento…</div>';
    try{
      if(!EAT_DATA){ EAT_DATA = await loadEatData(); }
      renderCategories(listHost);
    }catch(e){
      listHost.innerHTML = '<div class="error">Impossibile caricare la lista.</div>';
    }
    function close(){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); }
    closeBtn.onclick = close;
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
  }

  // Bind open button
  const btn = document.getElementById('eatOpen');
  if(btn){ btn.addEventListener('click', openEatList); }
  const navEat = document.getElementById('navEat');
  if(navEat){ navEat.addEventListener('click', (e)=>{ e.preventDefault(); try{ openEatList(); }finally{ try{ drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); const mb=document.getElementById('menuBtn'); if(mb){ mb.setAttribute('aria-expanded','false'); } }catch(_){} } }); }
})();


// Drawer: open Eat overlay from menu
(function(){
  const link = document.getElementById('navEat');
  const drawer = document.getElementById('drawer');
  const btn = document.getElementById('menuBtn');
  if(link){
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      try{ if(typeof openEatList==='function') openEatList(); }catch(_){}
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden','true');
      if(btn) btn.setAttribute('aria-expanded','false');
    });
  }
})();


// --- Do List (category-first) ---
async function loadDoData(){ const res = await fetch('assets/do.json', {cache:'no-store'}); return await res.json(); }
function isAppleDo(){ return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && !window.MSStream; }
function telHrefDo(num){ return 'tel:' + (num||'').replace(/\s+/g,''); }
function mapUrlDo(address, label){ const q = encodeURIComponent(address || label || ''); return isAppleDo() ? `https://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`; }

(function(){
  let DO_DATA = null;
  function renderDoCategories(host){
    host.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
    wrap.style.gap = '12px';
    DO_DATA.categories.forEach(cat=>{
      const card = document.createElement('div'); card.className='card';
      const h = document.createElement('h3'); h.textContent = I18N.t(cat.name); h.style.margin='8px 0';
      const p = document.createElement('p'); p.className='muted'; p.style.margin='0 0 8px 0'; p.textContent=(I18N.data?.[I18N.lang]?.do_select_category || 'Seleziona per vedere le attività');
      const a = document.createElement('a'); a.href='#'; a.className='btn'; a.textContent=(I18N.data?.[I18N.lang]?.open_category || 'Apri categoria');
      a.addEventListener('click', (e)=>{ e.preventDefault(); renderDoCategory(host, cat); });
      card.appendChild(h); card.appendChild(p); card.appendChild(a);
      wrap.appendChild(card);
    });
    host.appendChild(wrap);
  }
  function makeDoToolbar(host, title, onBack){
    const bar = document.createElement('div');
    bar.style.display='flex'; bar.style.alignItems='center'; bar.style.justifyContent='space-between';
    bar.style.gap='8px'; bar.style.margin='0 0 8px 0';
    const left = document.createElement('div');
    const back = document.createElement('a'); back.href='#'; back.className='btn outline'; back.textContent='← ' + I18N.t('back');
    back.addEventListener('click', (e)=>{ e.preventDefault(); onBack(); });
    left.appendChild(back);
    const h = document.createElement('strong'); h.textContent = title; h.style.fontSize='18px';
    bar.appendChild(left); bar.appendChild(h);
    host.appendChild(bar);
  }
  function renderDoCategory(host, cat){
    host.innerHTML = '';
    makeDoToolbar(host, I18N.t(cat.name), ()=>renderDoCategories(host));
    const box = document.createElement('div'); box.className='card';
    const ul = document.createElement('ul'); ul.style.margin='0'; ul.style.paddingInlineStart='1rem';
    (cat.items||[]).forEach(it=>{
      const li = document.createElement('li'); li.style.margin='0 0 .6rem 0';
      const strong = document.createElement('strong'); strong.textContent = it.name; li.appendChild(strong);
      if(it.address){ const addr = document.createElement('div'); addr.className='small'; addr.textContent=it.address; li.appendChild(addr); }
      const row = document.createElement('div'); row.style.display='flex'; row.style.flexWrap='wrap'; row.style.gap='8px'; row.style.marginTop='6px';
      const aPref = document.createElement('a'); aPref.href = mapUrlDo(it.address, it.name); aPref.target='_blank'; aPref.rel='noopener'; aPref.className='btn'; aPref.textContent=(I18N.data?.[I18N.lang]?.open_in_maps || 'Apri in Mappe');
      const aG = document.createElement('a'); aG.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(it.address || it.name); aG.target='_blank'; aG.rel='noopener'; aG.className='btn'; aG.textContent='Google'; aG.setAttribute('data-emoji','google');
      const aA = document.createElement('a'); aA.href = 'https://maps.apple.com/?q=' + encodeURIComponent(it.address || it.name); aA.target='_blank'; aA.rel='noopener'; aA.className='btn'; aA.textContent='Apple'; aA.setAttribute('data-emoji','apple');
      row.appendChild(aPref); row.appendChild(aG); row.appendChild(aA);
      ul.appendChild(li); li.appendChild(row);
    });
    box.appendChild(ul); host.appendChild(box);
  }
  async function openDoList(){ const overlay = document.getElementById('doOverlay'); const closeBtn = document.getElementById('doClose');
    const host = document.getElementById('doList');
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false');
    host.innerHTML = '<div class="muted">Caricamento…</div>';
    try{ if(!DO_DATA){ DO_DATA = await loadDoData(); } renderDoCategories(host); } catch(e){ host.innerHTML='<div class="error">Impossibile caricare.</div>'; }
    function close(){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); }
    closeBtn.onclick=close; overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
  }
  const btn = document.getElementById('doOpen'); if(btn){ btn.addEventListener('click', openDoList); }
  const navDo = document.getElementById('navDo'); if(navDo){ navDo.addEventListener('click', (e)=>{ e.preventDefault(); try{ openDoList(); }finally{ try{ drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); const mb=document.getElementById('menuBtn'); if(mb){ mb.setAttribute('aria-expanded','false'); } }catch(_){} } }); }
})();


(function bindDoOpenNav(){
  const doBtn = document.getElementById('doOpen');
  if(doBtn){ doBtn.addEventListener('click', (e)=>{ e.preventDefault(); openDoList(); }); }
  const navDo = document.getElementById('navDo');
  if(navDo){ navDo.addEventListener('click', (e)=>{ e.preventDefault(); openDoList();
    try{ const drawer = document.getElementById('drawer'); drawer && drawer.classList.remove('open'); drawer && drawer.setAttribute('aria-hidden','true');
      const mb=document.getElementById('menuBtn'); if(mb){ mb.setAttribute('aria-expanded','false'); } }catch(_){}
  }); }
})();

// --- WhatsApp contact button ---
(function initWhatsAppButton(){
  try{
    const btn = document.getElementById('waBtn');
    if(!btn) return;
    const telA = document.querySelector('a[href^="tel:+"]');
    let num = telA ? telA.getAttribute('href').replace('tel:','') : '+393478008505';
    const digits = num.replace(/[^0-9]/g,'');
    const lang = (document.documentElement.getAttribute('lang')||'it').toLowerCase();
    const msg = {
      it: 'Ciao! Vorrei informazioni per un soggiorno.',
      en: 'Hello! I would like information about a stay.',
      de: 'Hallo! Ich hätte gern Informationen zu einem Aufenthalt.'
    }[lang] || 'Ciao! Vorrei informazioni.';
    btn.href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(msg);
    btn.target = '_blank';
    btn.rel = 'noopener';
  }catch(e){ console.warn('WA button init failed', e); }
})();


// --- WhatsApp Contact ---
const WHATSAPP_PHONE = '+393478008505'; // cambia qui se necessario
function waSanitize(num){ return (num||'').replace(/[^0-9]/g,''); }
function waLink(message){
  const phone = waSanitize(WHATSAPP_PHONE);
  const text = encodeURIComponent(message || 'Ciao! Vorrei informazioni sull\'Agriturismo Corte San Girolamo.');
  // Prefer deep link on mobile; wa.me funziona ovunque (desktop → Web WhatsApp)
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? `whatsapp://send?phone=${phone}&text=${text}` : `https://wa.me/${phone}?text=${text}`;
}
function openWhatsApp(msg){
  try{
    const url = waLink(msg);
    window.open(url, '_blank', 'noopener');
  }catch(e){
    const phone = waSanitize(WHATSAPP_PHONE);
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener');
  }
}

(function(){
  const w = document.getElementById('navWhatsApp');
  if(w){
    w.addEventListener('click', (e)=>{
      e.preventDefault();
      openWhatsApp();
      try{
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden','true');
        const mb=document.getElementById('menuBtn'); if(mb){ mb.setAttribute('aria-expanded','false'); }
      }catch(_){}
    });
  }
})();


// --- WhatsApp contact (non-invasive) ---
const WHATSAPP_NUMBER_INTL = '+393478008505'; // default; change if needed
function waLink(text){
  const phone = (WHATSAPP_NUMBER_INTL||'').replace(/\D/g,'');
  const msg = encodeURIComponent(text || 'Ciao! Ho bisogno di informazioni.');
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? `whatsapp://send?phone=${phone}&text=${msg}` : `https://wa.me/${phone}?text=${msg}`;
}
function openWhatsApp(text){ window.open(waLink(text), '_blank'); }
function injectWhatsAppButton(){
  try{
    const callBtn = Array.from(document.querySelectorAll('a,button')).find(el => /chiama\s*ora/i.test(el.textContent||''));
    if(callBtn && !document.getElementById('waInlineBtn')){
      const wa = document.createElement('a');
      wa.id = 'waInlineBtn';
      wa.href = waLink('Ciao! Vorrei informazioni per un soggiorno.');
      wa.target = '_blank'; wa.rel='noopener';
      wa.className = (callBtn.className||'').replace(/\boutline\b/g,'').trim() || 'btn';
      wa.textContent = 'WhatsApp';
      callBtn.parentElement.insertBefore(wa, callBtn.nextSibling);
      return;
    }
    if(!document.getElementById('waMapBtn')){
      const host = document.querySelector('#mappa .container .card');
      if(host){
        const wa = document.createElement('a');
        wa.id = 'waMapBtn';
        wa.href = waLink('Ciao! Vorrei informazioni su disponibilità e prezzi.');
        wa.target = '_blank'; wa.rel='noopener';
        wa.className = 'btn outline';
        wa.style.marginLeft = '8px';
        wa.textContent = 'WhatsApp';
        const anyBtn = host.querySelector('.btn');
        if(anyBtn) anyBtn.after(wa); else host.appendChild(wa);
      }
    }
  }catch(e){ console.warn('WA inject fail', e); }
}



// Bind WhatsApp buttons in page
(function(){
  const btn1 = document.getElementById('waBtn');
  if(btn1){ btn1.addEventListener('click', (e)=>{ e.preventDefault(); openWhatsApp(); }); }
  const btn2 = document.getElementById('waFormBtn');
  if(btn2){
    btn2.addEventListener('click', (e)=>{
      e.preventDefault();
      const form = document.querySelector('form[name="booking"]');
      if(!form){ openWhatsApp(); return; }
      const fd = new FormData(form);
      function gv(k){ return (fd.get(k)||'').toString().trim(); }
      const msg = [
        'Richiesta info/prenotazione',
        `Nome: ${gv('name') || '—'}`,
        `Check-in: ${gv('checkin') || '—'}`,
        `Check-out: ${gv('checkout') || '—'}`,
        `Adulti: ${gv('adults') || '—'} | Bambini: ${gv('children') || '—'} | Camere: ${gv('rooms') || '—'}`,
        `Telefono: ${gv('phone') || '—'}`,
        (gv('message') ? `Messaggio: ${gv('message')}` : '')
      ].filter(Boolean).join('\n');
      openWhatsApp(msg);
    });
  }
})();


/* --- Gallery rewrite injected --- */

/**
 * Gallery rewrite for Corte San Girolamo
 * - Builds a11y-friendly grid of anchors with thumbnails
 * - Intercepts clicks/keys to open the existing lightbox (#lightbox, #lbImg, #lbPrev, #lbNext)
 * - Prevents any page navigation (e.g., if anchors have href)
 * - Uses assets/gallery.json: { "images": ["Agr-....jpg", ...] }
 */
(function(){
  const GALLERY_SELECTOR = '#gallery';
  const JSON_PATH = 'assets/gallery.json';
  const gallery = document.querySelector(GALLERY_SELECTOR);
  if(!gallery) return;

  // Lightbox refs (already in your index.html)
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');

  /** Internal state */
  let IMAGES = [];   // absolute src to full image
  let IDX = 0;

  /** Utils */
  function toPaths(name){
    // Turn "Agr-....jpg" into {base, small, medium, full}
    const isAbsolute = /^assets\//.test(name);
    const base = isAbsolute ? name : ('assets/gallery/' + name);
    const ext = base.split('.').pop();
    const baseNoExt = base.slice(0, -(ext.length+1));
    return {
      base,
      small: baseNoExt + '-480.jpg',
      medium: baseNoExt + '-800.jpg',
      full: base
    };
  }
  function preload(src){
    const i = new Image();
    i.decoding = 'async';
    i.loading = 'eager';
    i.src = src;
  }

  /** Lightbox controls (independent of any previous code) */
  function open(i){
    IDX = i;
    if(!lb || !lbImg) return;
    lbImg.src = IMAGES[IDX];
    lb.classList.add('open');
    lb.setAttribute('aria-hidden','false');
    // focus close for a11y
    if (lbClose) lbClose.focus();
    // preload neighbors
    const prev = (IDX - 1 + IMAGES.length) % IMAGES.length;
    const next = (IDX + 1) % IMAGES.length;
    preload(IMAGES[prev]);
    preload(IMAGES[next]);
  }
  function close(){
    if(!lb) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden','true');
  }
  function prev(){
    IDX = (IDX - 1 + IMAGES.length) % IMAGES.length;
    if(lbImg) lbImg.src = IMAGES[IDX];
  }
  function next(){
    IDX = (IDX + 1) % IMAGES.length;
    if(lbImg) lbImg.src = IMAGES[IDX];
  }

  // Wire lightbox buttons & keys (idempotent)
  if (lbClose) lbClose.addEventListener('click', close, { once:false });
  if (lbPrev)  lbPrev .addEventListener('click', prev,  { once:false });
  if (lbNext)  lbNext .addEventListener('click', next,  { once:false });
  document.addEventListener('keydown', (e)=>{
    if(!lb || !lb.classList.contains('open')) return;
    if(e.key === 'Escape')   { e.preventDefault(); close(); }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); prev(); }
    if(e.key === 'ArrowRight'){e.preventDefault(); next(); }
  });

  /** Build gallery grid */
  async function build(){
    try{
      const res = await fetch(JSON_PATH, { cache: 'no-store' });
      const data = await res.json();
      const list = Array.isArray(data.images) ? data.images : [];

      // Clear existing content
      gallery.innerHTML = '';

      IMAGES = list.map(name => toPaths(name).full);

      list.forEach((name, i)=>{
        const p = toPaths(name);
        const a = document.createElement('a');
        a.href = p.full;
        a.className = 'g-item';
        a.setAttribute('data-index', String(i));
        a.setAttribute('aria-label', 'Apri immagine ' + (i+1));
        a.setAttribute('tabindex', '0');

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = 'Foto galleria';
        img.src = p.medium; // a good default
        img.srcset = `${p.small} 480w, ${p.medium} 800w, ${p.full} 1280w`;
        img.sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
        a.appendChild(img);

        gallery.appendChild(a);
      });

      // Event delegation for click
      gallery.addEventListener('click', (e)=>{
        const a = e.target.closest('a.g-item');
        if(!a || !gallery.contains(a)) return;
        e.preventDefault();
        e.stopPropagation();
        const i = parseInt(a.getAttribute('data-index')||'0', 10) || 0;
        open(i);
      }, { capture: true }); // capture ensures default is prevented early

      // Keyboard: Enter/Space on focused item
      gallery.addEventListener('keydown', (e)=>{
        const a = e.target.closest('a.g-item');
        if(!a) return;
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          const i = parseInt(a.getAttribute('data-index')||'0', 10) || 0;
          open(i);
        }
      });

      // Expose controls (optional)
      window.CSGallery = { open, close, next, prev, list: ()=>IMAGES.slice() };

    }catch(err){
      console.warn('Gallery JSON non disponibile', err);
    }
  }

  // Build asap
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', build, { once:true });
  }else{
    build();
  }
})();



// === Patch: aggiorna <html lang> e og:locale quando cambia lingua ===
(function(){
  try{
    if(window.I18N && typeof window.I18N.apply === 'function'){
      const _apply = window.I18N.apply.bind(window.I18N);
      window.I18N.apply = async function(lang){
        const res = await _apply(lang);
        try{
          document.documentElement.lang = lang;
          const og = document.querySelector('meta[property="og:locale"]');
          if(og){
            og.setAttribute('content', lang==='it' ? 'it_IT' : (lang==='de' ? 'de_DE' : 'en_GB'));
          }
        }catch(e){}
        return res;
      }
    }
  }catch(e){}
})();

 
// === Patch: alt descrittivo per l'immagine nel lightbox ===
(function(){
  const img = document.getElementById('lbImg');
  function updateAlt(){
    if(!img) return;
    const galleryImages = Array.from(document.querySelectorAll('#gallery img'));
    const total = galleryImages.length || 0;
    let idx = -1;
    const current = img.src ? img.src.split('/').pop() : '';
    for(let i=0;i<galleryImages.length;i++){
      const g = galleryImages[i];
      const cand = (g.currentSrc || g.src || '').split('/').pop();
      if(cand && current && current.endsWith(cand)){ idx = i; break; }
    }
    img.alt = (idx>=0 && total>0) ? `Foto ${idx+1} di ${total} – Agriturismo Corte San Girolamo` : 'Foto galleria';
  }
  try{
    const mo = new MutationObserver(updateAlt);
    if(img) mo.observe(img, {attributes:true, attributeFilter:['src']});
    document.getElementById('lbPrev')?.addEventListener('click', ()=>setTimeout(updateAlt, 0));
    document.getElementById('lbNext')?.addEventListener('click', ()=>setTimeout(updateAlt, 0));
    updateAlt();
  }catch(e){}
})();

 
// === Patch: miglioramenti form prenotazioni ===
(function(){
  const form = document.querySelector('form[name="booking"]');
  if(!form) return;
  const inEl = form.querySelector('input[name="checkin"]');
  const outEl = form.querySelector('input[name="checkout"]');
  const phone = form.querySelector('input[name="phone"]');
  const success = document.getElementById('bookingSuccess');
  const error = document.getElementById('bookingError');
  try{ if(success) success.setAttribute('aria-live','polite'); }catch(e){}
  try{ if(error) error.setAttribute('aria-live','polite'); }catch(e){}
  const today = new Date().toISOString().slice(0,10);
  if(inEl){ inEl.min = today; inEl.addEventListener('change', ()=>{ if(outEl) outEl.min = inEl.value || today; }); }
  if(outEl){ outEl.min = today; }
  if(phone && !phone.pattern){
    phone.pattern = String.raw`^\+?[0-9\s\-().]{6,}$`;
    phone.title = 'Inserisci un numero di telefono valido (consentiti +, spazi e trattini).';
  }
})();






// --- Booking overlay logic ---
(function(){
  const body = document.body;

  function open(id){
    const el = document.getElementById(id);
    if(!el) return;

    // Show and lock scroll
    el.setAttribute('aria-hidden','false');
    body.dataset.lockScroll = '1';
    body.style.overflow='hidden';

    // Focus trap
    const focusable = el.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0] || el;
    const last  = focusable[focusable.length-1] || el;
    if(el._trapHandler){ el.removeEventListener('keydown', el._trapHandler); }
    el._trapHandler = function(ev){
      if(ev.key === 'Tab'){
        if(ev.shiftKey && document.activeElement === first){ ev.preventDefault(); last.focus(); }
        else if(!ev.shiftKey && document.activeElement === last){ ev.preventDefault(); first.focus(); }
      } else if (ev.key === 'Escape'){
        close(id);
      }
    };
    el.addEventListener('keydown', el._trapHandler);
    setTimeout(()=>{ if(first && first.focus) first.focus({preventScroll:true}); }, 0);
  }

  function close(id){
    const el = document.getElementById(id);
    if(!el) return;
    el.setAttribute('aria-hidden','true');
    if(el._trapHandler){ el.removeEventListener('keydown', el._trapHandler); el._trapHandler = null; }
    body.style.overflow='';
    delete body.dataset.lockScroll;
  }

  // Delegated clicks
  document.addEventListener('click', (e)=>{
    const t = e.target;

    // Openers
    if(t.closest('#openBooking')){ e.preventDefault(); open('bookingOverlay'); return; }
    if(t.closest('#openBookingForm')){ e.preventDefault(); close('bookingOverlay'); open('bookingFormOverlay'); return; }

    // Close buttons inside overlays
    if(t.closest('.overlay-close')){
      const ov = t.closest('.overlay');
      if(ov && ov.id) close(ov.id);
      return;
    }

    // NEW: open booking overlay from any nav link targeting "#book…"
    const anchor = t.closest('a');
    if (anchor) {
      const href = (anchor.getAttribute('href') || '').trim();
      const dataEmoji = anchor.getAttribute('data-emoji') || '';
      const dataI18n = anchor.getAttribute('data-i18n') || '';
      // If it's the "Richiesta disponibilità" nav item (various selectors) open the overlay
      if (href.startsWith('#book') || dataEmoji === 'request' || dataI18n === 'nav_prenotazioni') {
        e.preventDefault();
        open('bookingOverlay');
        return;
      }
    }
  }, false);

  // WhatsApp link & phone number: customize here if necessario
  const wa = document.getElementById('bookingWhatsApp');
  const tel = document.getElementById('bookingCall');
  const phoneE164 = '+393478008505'; // TODO: aggiorna
  const localPhone = '3478008505';   // TODO: aggiorna
  if(wa){
    let waMsg = encodeURIComponent('Ciao! Vorrei informazioni/disponibilità.');
    wa.href = `https://wa.me/${phoneE164.replace(/\D/g,'')}?text=${waMsg}`;
  }
  if(tel){
    tel.href = `tel:${localPhone}`;
  }

  // Minimal submit handler
  const form = document.getElementById('bookingForm');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      // collect data
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      console.log('Richiesta prenotazione', payload);
      alert('Richiesta inviata! Ti ricontatteremo al più presto.');
      form.reset();
      close('bookingFormOverlay');
    });
  }
})();




/* discover navigation and tabs */
(function(){
  function selectTab(which){
    const eat = document.getElementById('eatList');
    const dol = document.getElementById('doList');
    const tabs = document.querySelectorAll('#discoverOverlay .tab');
    tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===which));
    if(eat&&dol){ eat.hidden = which!=='eat'; dol.hidden = which!=='do'; }
  }
  function ensureOpen(){
    const ov = document.getElementById('discoverOverlay'); const c = document.getElementById('discoverClose');
    if(!ov||!c) return;
    ov.classList.add('open'); ov.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    c.onclick = ()=>{ ov.classList.remove('open'); ov.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
    ov.addEventListener('click',(e)=>{ if(e.target===ov) c.click(); });
  }
  const nav = document.getElementById('navDiscover'); // default anchor behavior (smooth scroll)); }
  const d1 = document.getElementById('discoverOpen');
  if(d1){ d1.addEventListener('click', (e)=>{ e.preventDefault(); selectTab('eat'); openEatList(); ensureOpen(); }); }
  const d2 = document.getElementById('discoverOpenDo');
  if(d2){ d2.addEventListener('click', (e)=>{ e.preventDefault(); selectTab('do'); openDoList(); ensureOpen(); }); }
  document.addEventListener('click', (e)=>{
    const tab = e.target.closest('#discoverOverlay .tab'); if(!tab) return;
    e.preventDefault(); selectTab(tab.dataset.tab);
    if(tab.dataset.tab==='eat'){ openEatList(); } else { openDoList(); }
  });
})();



// === Fallback: Scopri Mantova renderers (if native ones fail) ===
(function(){
  function isApple(){ return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && !window.MSStream; }
  function mapUrl(address){
    const q = encodeURIComponent(address||'');
    return isApple() ? `https://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
  function telHref(num){ return 'tel:' + String(num||'').replace(/\s+/g,''); }

  async function fetchJSON(path){
    const res = await fetch(path, {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  }

  function renderCategories(host, data, type){
    host.innerHTML='';
    const wrap = document.createElement('div');
    wrap.style.display='grid';
    wrap.style.gridTemplateColumns='repeat(auto-fit, minmax(220px,1fr))';
    wrap.style.gap='12px';
    (data.categories||[]).forEach(cat=>{
      const card=document.createElement('div'); card.className='card';
      const h=document.createElement('h3'); h.textContent=cat.name||''; h.style.margin='8px 0';
      const p=document.createElement('p'); p.className='muted'; p.textContent= type==='eat' ? 'Seleziona per vedere i ristoranti' : 'Seleziona per vedere le attività';
      const a=document.createElement('a'); a.href='#'; a.className='btn'; a.textContent='Apri categoria';
      a.addEventListener('click', (e)=>{ e.preventDefault(); renderCategory(host, data, cat, type);});
      card.appendChild(h); card.appendChild(p); card.appendChild(a);
      wrap.appendChild(card);
    });
    host.appendChild(wrap);
  }

  function renderToolbar(host, title, onBack){
    const bar=document.createElement('div');
    bar.style.display='flex'; bar.style.alignItems='center'; bar.style.justifyContent='space-between';
    const h=document.createElement('h3'); h.textContent=title;
    const back=document.createElement('button'); back.className='btn btn-outline'; back.textContent='Indietro'; back.addEventListener('click', onBack);
    bar.appendChild(h); bar.appendChild(back);
    host.appendChild(bar);
  }

  function renderCategory(host, data, cat, type){
    host.innerHTML='';
    renderToolbar(host, cat.name||'', ()=>renderCategories(host, data, type));
    const ul=document.createElement('ul'); ul.style.listStyle='none'; ul.style.padding='0'; ul.style.margin='10px 0';
    (cat.items||[]).forEach(item=>{
      const li=document.createElement('li'); li.style.padding='10px 8px'; li.style.borderBottom='1px solid #eee';
      const name=document.createElement('div'); name.style.fontWeight='600'; name.textContent=item.name||'';
      const row=document.createElement('div'); row.style.display='flex'; row.style.flexWrap='wrap'; row.style.gap='10px'; row.style.marginTop='6px';
      if(item.address){
        const aMap=document.createElement('a'); aMap.href=mapUrl(item.address, item.name); aMap.target='_blank'; aMap.rel='noopener'; aMap.className='btn btn-outline'; aMap.textContent='Apri mappa';
        row.appendChild(aMap);
      }
      if(item.phone){
        const aTel=document.createElement('a'); aTel.href=telHref(item.phone); aTel.className='btn btn-outline'; aTel.textContent='Chiama';
        row.appendChild(aTel);
      }
      if(item.website){
        const aWeb=document.createElement('a'); aWeb.href=item.website; aWeb.target='_blank'; aWeb.rel='noopener'; aWeb.className='btn btn-outline'; aWeb.textContent='Sito';
        row.appendChild(aWeb);
      }
      li.appendChild(name); li.appendChild(row); ul.appendChild(li);
    });
    host.appendChild(ul);
  }

  async function openEatListFallback(){
    const overlay = document.getElementById('eatOverlay');
    const closeBtn = document.getElementById('eatClose');
    const listHost = document.getElementById('eatList');
    if(!overlay || !closeBtn || !listHost) return;
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    listHost.innerHTML = '<div class="muted">Caricamento…</div>';
    try{
      const data = await fetchJSON('assets/eat.json');
      renderCategories(listHost, data, 'eat');
    }catch(e){
      listHost.innerHTML = '<div class="error">Impossibile caricare la lista.</div>';
    }
    closeBtn.onclick = ()=>{ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeBtn.click(); });
  }

  async function openDoListFallback(){
    const overlay = document.getElementById('doOverlay');
    const closeBtn = document.getElementById('doClose');
    const host = document.getElementById('doList');
    if(!overlay || !closeBtn || !host) return;
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    host.innerHTML = '<div class="muted">Caricamento…</div>';
    try{
      const data = await fetchJSON('assets/do.json');
      renderCategories(host, data, 'do');
    }catch(e){
      host.innerHTML = '<div class="error">Impossibile caricare.</div>';
    }
    closeBtn.onclick = ()=>{ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeBtn.click(); });
  }

  // Bind/override: if native openers exist, keep them; also bind fallbacks to ensure population
  try{
    const eatBtn = document.getElementById('eatOpen');
    if(eatBtn){ eatBtn.addEventListener('click', (e)=>{ setTimeout(()=>{ const h=document.getElementById('eatList'); if(h && !h.children.length){ openEatListFallback(); } }, 0); }); }
    const doBtn = document.getElementById('doOpen');
    if(doBtn){ doBtn.addEventListener('click', (e)=>{ setTimeout(()=>{ const h=document.getElementById('doList'); if(h && !h.children.length){ openDoListFallback(); } }, 0); }); }
    const navEat = document.getElementById('navEat');
    if(navEat){ navEat.addEventListener('click', (e)=>{ setTimeout(()=>{ const h=document.getElementById('eatList'); if(h && !h.children.length){ openEatListFallback(); } }, 0); }); }
    const navDo = document.getElementById('navDo');
    if(navDo){ navDo.addEventListener('click', (e)=>{ setTimeout(()=>{ const h=document.getElementById('doList'); if(h && !h.children.length){ openDoListFallback(); } }, 0); }); }
  }catch(_){}
})();

/* gallery toggle */
(function(){
  const wrap = document.querySelector('.gallery-collapsible');
  const btn = document.getElementById('galleryToggle');
  if(!wrap || !btn) return;
  function refreshLabel(){
    const expanded = wrap.getAttribute('data-expanded') === 'true';
    btn.textContent = expanded ? 'Mostra meno' : 'Vedi tutte le foto';
  }
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const expanded = wrap.getAttribute('data-expanded') === 'true';
    wrap.setAttribute('data-expanded', expanded ? 'false' : 'true');
    refreshLabel();
  });
  refreshLabel();
})();

/* gallery carousel ensure nav + controls */
(function(){
  const gal = document.querySelector('#galleria .gallery.carousel');
  if(!gal) return;
  let vp = gal.closest('.gallery-viewport');
  if(!vp){
    vp = document.createElement('div'); vp.className='gallery-viewport';
    gal.parentNode.insertBefore(vp, gal); vp.appendChild(gal);
  }
  let prev = vp.querySelector('#galPrev');
  let next = vp.querySelector('#galNext');
  if(!prev){ prev=document.createElement('button'); prev.id='galPrev'; prev.className='gallery-nav prev'; prev.setAttribute('aria-label','Indietro'); prev.textContent='‹'; vp.insertBefore(prev, gal); }
  if(!next){ next=document.createElement('button'); next.id='galNext'; next.className='gallery-nav next'; next.setAttribute('aria-label','Avanti'); next.textContent='›'; vp.appendChild(next); }
  function scrollDelta(dx){ gal.scrollBy({left: dx, behavior: 'smooth'}); }
  function update(){
    const overflow = gal.scrollWidth > gal.clientWidth + 2;
    prev.style.display = next.style.display = overflow ? '' : 'none';
    prev.disabled = gal.scrollLeft <= 0;
    next.disabled = gal.scrollLeft >= gal.scrollWidth - gal.clientWidth - 2;
  }
  prev.addEventListener('click', ()=> scrollDelta(-(gal.clientWidth*0.9)));
  next.addEventListener('click', ()=> scrollDelta( gal.clientWidth*0.9 ));
  gal.setAttribute('tabindex','0');
  gal.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowLeft'){ e.preventDefault(); scrollDelta(-(gal.clientWidth*0.9)); }
    if(e.key==='ArrowRight'){ e.preventDefault(); scrollDelta( gal.clientWidth*0.9 ); }
  });
  gal.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update, {passive:true});
  setTimeout(update, 0);
})();

/* gallery carousel ensure nav + controls (final) */
(function(){
  const vp = document.querySelector('#galleria .gallery-viewport');
  const gal = vp && vp.querySelector('.gallery.carousel');
  if(!vp || !gal) return;
  let prev = vp.querySelector('#galPrev');
  let next = vp.querySelector('#galNext');
  function scrollDelta(dx){ gal.scrollBy({left: dx, behavior: 'smooth'}); }
  function update(){
    const overflow = gal.scrollWidth > gal.clientWidth + 2;
    if(prev && next){
      prev.style.display = next.style.display = overflow ? '' : 'none';
      prev.disabled = gal.scrollLeft <= 0;
      next.disabled = gal.scrollLeft >= gal.scrollWidth - gal.clientWidth - 2;
    }
  }
  if(prev){ prev.addEventListener('click', ()=> scrollDelta(-(gal.clientWidth*0.9))); }
  if(next){ next.addEventListener('click', ()=> scrollDelta( gal.clientWidth*0.9 )); }
  gal.setAttribute('tabindex','0');
  gal.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowLeft'){ e.preventDefault(); scrollDelta(-(gal.clientWidth*0.9)); }
    if(e.key==='ArrowRight'){ e.preventDefault(); scrollDelta( gal.clientWidth*0.9 ); }
  });
  gal.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update, {passive:true});
  setTimeout(update, 0);
})();

// === Flash group wrappers for sections (so the highlight matches the card block under the title) ===
(function(){
  function ensureFlashGroup_Colazioni(){
    const sec = document.getElementById('colazioni');
    if(!sec) return;
    if(sec.querySelector(':scope > .flash-group')) return;
    const grid = Array.from(sec.children).find(el => el.classList && el.classList.contains('grid'));
    if(!grid) return;
    const group = document.createElement('div');
    group.className = 'flash-group';
    sec.insertBefore(group, grid);
    group.appendChild(grid);
  }
  function ensureFlashGroup_Esperienze(){
    const sec = document.getElementById('esperienze');
    if(!sec) return;
    if(sec.querySelector(':scope > .flash-group')) return;
    const children = Array.from(sec.children).filter(el => !(el.tagName && el.tagName.toUpperCase()==='H2'));
    if(!children.length) return;
    const group = document.createElement('div');
    group.className = 'flash-group';
    sec.insertBefore(group, children[0]);
    children.forEach(ch => group.appendChild(ch));
  }
  window.addEventListener('DOMContentLoaded', ()=>{
    ensureFlashGroup_Colazioni();
    ensureFlashGroup_Esperienze();
  });
  window.addEventListener('load', ()=>{
    ensureFlashGroup_Colazioni();
    ensureFlashGroup_Esperienze();
  });
})();

// Re-apply flash immediately and after scroll settle
(function(){
  function flashTarget(id){
    if(!id) return;
    const sec = document.getElementById(id);
    if(!sec) return;
    const group = sec.querySelector(':scope > .flash-group');
    const grid  = sec.querySelector(':scope > .grid');
    const target = group || grid || sec.querySelector('.card') || sec;
    // restart both class-based and CSS-only ring
    target.classList.remove('flash-highlight');
    void target.offsetWidth;
    target.classList.add('flash-highlight');
    // repeat once more a bit later to catch smooth-scroll end
    setTimeout(()=>{
      target.classList.remove('flash-highlight');
      void target.offsetWidth;
      target.classList.add('flash-highlight');
    }, 400);
  }
  // Make globally available (overwrite if exists)
  window.flashTarget = flashTarget;
  // Hook nav anchors
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', ()=>{
        const id = a.getAttribute('href').replace(/^#/, '');
        // fire soon and later
        flashTarget(id);
        setTimeout(()=>flashTarget(id), 350);
      });
    });
    // initial hash
    if(location.hash){
      const id = location.hash.replace(/^#/, '');
      setTimeout(()=>flashTarget(id), 450);
    }
  });
  window.addEventListener('hashchange', ()=>{
    const id = (location.hash||'').replace(/^#/,'');
    flashTarget(id);
  });
})();

// === Soft reveal on scroll (IntersectionObserver) ===
(function(){
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    function prepReveals(){
      // Section titles and cards
      document.querySelectorAll('.section-title, .container .card').forEach(el=>{
        if(!el.classList.contains('reveal')) el.classList.add('reveal');
        io.observe(el);
      });
      // Stagger grid children a bit
      document.querySelectorAll('.container .grid').forEach(grid=>{
        const kids = Array.from(grid.children);
        kids.forEach((el,i)=>{
          if(el.classList && !el.classList.contains('reveal')){
            el.classList.add('reveal');
            el.style.transitionDelay = Math.min(i*70, 420) + 'ms';
            io.observe(el);
          }
        });
      });
    }
    window.addEventListener('DOMContentLoaded', prepReveals);
    window.addEventListener('load', prepReveals);
  }
})();

// === Hero parallax (soft) ===
(function(){
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('header.hero');
  if(!hero || reduce) return;
  hero.dataset.parallax = 'soft';
  let ticking = false;
  function onScroll(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{
      const rect = hero.getBoundingClientRect();
      // Move background slightly opposite to scroll for parallax illusion
      const y = Math.max(-20, Math.min(20, -rect.top * 0.06)); // clamp to [-20, 20] px
      hero.style.setProperty('--parallax-y', y.toFixed(2) + 'px');
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  onScroll();
})();

// === Emoji micro-bounce when section title is revealed ===
(function(){
  if(!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const title = entry.target;
        // Find emoji span candidates inside the title
        const emoji = title.querySelector('.nav-emoji, .emoji, [class*="emoji"]') || null;
        if(emoji && !emoji.classList.contains('emoji-bounce')){
          emoji.classList.add('emoji-bounce');
        }
        io.unobserve(title);
      }
    });
  }, { threshold: 0.25 });
  function prep(){
    document.querySelectorAll('.section-title').forEach(t=> io.observe(t));
  }
  window.addEventListener('DOMContentLoaded', prep);
  window.addEventListener('load', prep);
})();
