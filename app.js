// Drawer toggle
const drawer = document.getElementById('drawer');
const btn = document.getElementById('menuBtn');
const links = drawer.querySelectorAll('a');
btn.addEventListener('click', ()=>{
  const open = drawer.classList.toggle('open');
  drawer.setAttribute('aria-hidden', !open);
});
links.forEach(a=>a.addEventListener('click', ()=>{
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', true);
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
  try{
    const res = await fetch('assets/gallery.json');
    const data = await res.json();
    const box = document.getElementById('gallery');
    (data.images || []).forEach(src=>{
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = src.startsWith('assets/') ? src : ('assets/gallery/' + src);
      img.alt = 'Foto galleria';
      box.appendChild(img);
    });
  }catch(e){ console.warn('Galleria non disponibile', e); }
}
loadGallery();

// PWA
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(console.error);
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

  function open(i){
    idx = i;
    lbImg.src = images[idx].src;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
  }
  function close(){
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
          img.addEventListener('click', ()=>open(i));
        }
      });
    });
    obs.observe(galleryBox, {childList:true});
  }

  closeBtn?.addEventListener('click', close);
  lb?.addEventListener('click', (e)=>{ if(e.target===lb) close(); });
  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);
  document.addEventListener('keydown', (e)=>{
    if(!lb.classList.contains('open')) return;
    if(e.key==='Escape') close();
    if(e.key==='ArrowLeft') prev();
    if(e.key==='ArrowRight') next();
  });
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
