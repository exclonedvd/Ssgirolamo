
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
