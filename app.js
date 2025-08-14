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