/* Planner vector-rich (no html2canvas) */
(function(){
  var ITZ='Europe/Rome';
  var BRAND_BG={r:246,g:239,b:233};
  var ACCENT={r:43,g:90,b:68};

  function capFirst(s){ var t=(s==null?'':String(s)); return t ? t.charAt(0).toLocaleUpperCase('it-IT') + t.slice(1) : ''; }
  function todayISO(){ return new Date().toLocaleDateString('en-CA',{timeZone:ITZ}); }
  function addDays(iso,n){ var d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toLocaleDateString('en-CA',{timeZone:ITZ}); }
  function fmtDateCap(iso){ try{var d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long'}).replace(/^./,c=>c.toUpperCase());}catch(e){return iso;} }
  function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function ensurePDF(){ if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve(); return loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js').catch(function(){ return loadScript('assets/vendor/jspdf.umd.min.js'); }); }

  function injectCSS(){ if(document.getElementById('planner-css-vr')) return; var s=document.createElement('style'); s.id='planner-css-vr'; s.textContent="#planner-progress{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.28);backdrop-filter:blur(2px);z-index:99999}#planner-progress.open{display:flex}#planner-progress .box{min-width:260px;max-width:90vw;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.2);padding:14px 16px}#planner-progress .head{display:flex;align-items:center;gap:8px;margin-bottom:10px}#planner-progress .head .spinner{width:16px;height:16px;border:2px solid #2b5a44;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite}#planner-progress .head .label{font-weight:600}#planner-progress .bar{background:#eee;height:8px;border-radius:999px;overflow:hidden}#planner-progress .bar i{display:block;height:100%;width:0;background:#2b5a44}@keyframes spin{to{transform:rotate(360deg)}}"; document.head.appendChild(s); }

  var Progress={ _ui:null,_cur:0,_tot:1,
    _ensure(){ injectCSS(); if(this._ui) return this._ui; var w=document.createElement('div'); w.id='planner-progress'; w.innerHTML='<div class=box><div class=head><div class=spinner></div><div class=label>Preparazione…</div></div><div class=bar><i></i></div></div>'; document.body.appendChild(w); this._ui={wrap:w,bar:w.querySelector('.bar i'),label:w.querySelector('.label')}; return this._ui; },
    init(t){ this._ensure(); this._tot=Math.max(1,t||1); this._cur=0; this._render('Preparazione…',0); },
    _render(l,n){ var ui=this._ensure(); var pct=Math.round(100*(n/Math.max(1,this._tot))); ui.bar.style.width=pct+'%'; if(l) ui.label.textContent=l; },
    start(l){ this._ensure().wrap.classList.add('open'); this._cur=0; this._render(l||'Avvio…',0); },
    step(l){ this._cur++; this._render(l,this._cur); },
    finish(){ var ui=this._ensure(); this._render('Fatto',this._tot); setTimeout(function(){ ui.wrap.classList.remove('open'); }, 500); },
    error(l){ var ui=this._ensure(); ui.label.textContent=l||'Errore'; ui.bar.style.width='0%'; ui.wrap.classList.add('open'); }
  };

  // Load local JSON assets
  function loadJSON(url){ return fetch(url).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }); }
  function withTimeout(p, ms){ return new Promise(function(res,rej){ var to=setTimeout(function(){ rej(new Error('timeout '+ms+'ms')); }, ms); p.then(function(v){ clearTimeout(to); res(v); }, function(e){ clearTimeout(to); rej(e); }); }); }
  function fetchWeather(startISO,endISO){
    var lat=45.156, lon=10.791;
    var url=new URL('https://api.open-meteo.com/v1/forecast');
    url.search=new URLSearchParams({ latitude:lat, longitude:lon, timezone:ITZ,
      daily:'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      start_date:startISO, end_date:endISO }).toString();
    return withTimeout(fetch(url.toString()).then(function(r){ if(!r.ok) throw 0; return r.json(); }), 3000)
      .then(function(j){ var out=[], n=(j.daily&&j.daily.time?j.daily.time.length:0); for(var i=0;i<n;i++){ out.push({date:j.daily.time[i], tmin:j.daily.temperature_2m_min[i], tmax:j.daily.temperature_2m_max[i], pprob:j.daily.precipitation_probability_max[i], wcode:j.daily.weathercode[i]}); } return out; })
      .catch(function(){ return []; });
  }

  function pick(items, used){ for(var i=0;i<items.length;i++){ var key=(items[i].name||'')+'|'+(items[i].address||''); if(!used[key]){ used[key]=1; return items[i]; } } return items[0] || {name:'—'}; }

  function serializePrefs(){
    var form=document.getElementById('plannerForm'); if(!form) return {name:'',days:3,interests:['arte','natura','enogastronomia'],start:todayISO()};
    var fd=new FormData(form);
    var name=capFirst(String(fd.get('name')||''));
    var days=Math.max(1, Math.min(7, parseInt(fd.get('days')||'3',10)));
    var ints=[]; form.querySelectorAll('input[name="interests"]:checked').forEach(function(i){ints.push(i.value);});
    var start=(document.getElementById('plannerStartDate') && document.getElementById('plannerStartDate').value) || todayISO();
    if(!ints.length) ints=['arte','natura','enogastronomia'];
    return {name:name,days:days,interests:ints,start:start};
  }

  function generatePDF(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    try{
      var btn=document.getElementById('plannerGenerate'); if(btn){ btn.disabled=true; btn.setAttribute('aria-busy','true'); }
      Progress.init(6); Progress.start('Preparazione…');

      var prefs=serializePrefs();
      var startISO=prefs.start, endISO=addDays(startISO, prefs.days-1);

      Promise.all([
        ensurePDF().then(function(){ Progress.step('Librerie…'); }),
        loadJSON('assets/do.json').then(function(j){ Progress.step('Luoghi…'); return j; }),
        loadJSON('assets/eat.json').then(function(j){ Progress.step('Ristoranti…'); return j; }),
        fetchWeather(startISO,endISO).then(function(w){ Progress.step('Meteo…'); return w; })
      ]).then(function(arr){
        var _ = window.jspdf.jsPDF;
        var pdf=new _.prototype.constructor('p','mm','a4');
        var pw=pdf.internal.pageSize.getWidth();
        var ph=pdf.internal.pageSize.getHeight();

        // parse assets
        var doCat = arr[1] && arr[1].categories || [];
        var eatCat = arr[2] && arr[2].categories || [];
        var meteo = arr[3] || [];

        var vedere = (doCat.find(c=>c.slug==='vedere')||{}).items||[];
        var esc = (doCat.find(c=>c.slug==='escursioni')||{}).items||[];
        var prov = (doCat.find(c=>c.slug==='provare')||{}).items||[];
        var food = (eatCat.find(c=>c.slug==='tradizione')||{}).items||[];
        if(food.length===0){ food = (eatCat[0]||{}).items||[]; }

        // PAGE BG
        pdf.setFillColor(BRAND_BG.r,BRAND_BG.g,BRAND_BG.b); pdf.rect(0,0,pw,ph,'F');

        // HEADER
        pdf.setDrawColor(ACCENT.r,ACCENT.g,ACCENT.b); pdf.setLineWidth(0.8); pdf.line(8,12,pw-8,12);
        pdf.setTextColor(0,0,0);
        pdf.setFontSize(18); var safe=capFirst((prefs.name||'Ospite').trim()); pdf.text('Itinerario per '+safe, 8, 20);
        pdf.setFontSize(11); pdf.text('Periodo: '+fmtDateCap(startISO)+' – '+fmtDateCap(endISO), 8, 26);

        // Meteo (se disponibile)
        var y=34;
        if(meteo.length){
          pdf.setFontSize(12); pdf.text('Meteo (max/min, pioggia):', 8, y); y+=6;
          pdf.setFontSize(11);
          meteo.forEach(function(d){ pdf.text(fmtDateCap(d.date)+': '+Math.round(d.tmax)+'°/'+Math.round(d.tmin)+'°  •  '+(d.pprob==null?'—':d.pprob+'%'), 10, y); y+=5; });
          y+=4;
        }

        // Giorni
        var used={};
        for(var i=0;i<prefs.days;i++){
          if(y>ph-40){ pdf.addPage(); pdf.setFillColor(BRAND_BG.r,BRAND_BG.g,BRAND_BG.b); pdf.rect(0,0,pw,ph,'F'); y=20; }
          var dISO=addDays(startISO,i);
          pdf.setFontSize(13); pdf.setTextColor(0,0,0); pdf.text((i+1)+'. '+fmtDateCap(dISO), 8, y); y+=6;
          pdf.setFontSize(11); pdf.setTextColor(60);

          var matt = pick(vedere.concat(prov), used);
          var pom = pick(esc.concat(vedere), used);
          var sera = pick(food, used);

          function lineFor(item){ var base=(item.name||''); if(item.address) base+=' — '+item.address; if(item.phone) base+=' — '+item.phone; return base; }

          pdf.text('Mattina: '+lineFor(matt), 10, y); y+=5;
          pdf.text('Pomeriggio: '+lineFor(pom), 10, y); y+=5;
          pdf.text('Cena: '+lineFor(sera), 10, y); y+=7;
          Progress.step('Giorno '+(i+1)+'/'+prefs.days+'…');
        }

        // FOOTER
        pdf.setTextColor(120); pdf.setFontSize(9);
        pdf.text('Corte San Girolamo · Itinerario generato automaticamente', 8, ph-8);

        Progress.step('Salvataggio…');
        var fname='Itinerario_'+(prefs.name||'Ospite').replace(/[^a-z0-9-_]+/gi,'_')+'_'+startISO+'_'+prefs.days+'gg.pdf';
        pdf.save(fname);
        Progress.finish();
      }).catch(function(err){
        console.error(err); Progress.error('Errore'); alert('Errore PDF: '+(err && err.message?err.message:err));
      }).finally(function(){ var btn=document.getElementById('plannerGenerate'); if(btn){ btn.disabled=false; btn.removeAttribute('aria-busy'); } });
    }catch(err){
      console.error(err); Progress.error('Errore'); alert('Errore PDF: '+(err && err.message?err.message:err));
      var btn=document.getElementById('plannerGenerate'); if(btn){ btn.disabled=false; btn.removeAttribute('aria-busy'); }
    }
  }

  function attach(){
    var form=document.getElementById('plannerForm'); var btn=document.getElementById('plannerGenerate');
    if(btn){ btn.type='button'; btn.addEventListener('click', generatePDF); }
    if(form){ form.setAttribute('novalidate','novalidate'); form.addEventListener('submit', function(e){ e.preventDefault(); generatePDF(e); }, true); }
    document.addEventListener('click', function(e){ var t=e.target; if(!t) return; if(t.id==='plannerGenerate' || (t.closest && t.closest('#plannerGenerate'))){ e.preventDefault(); generatePDF(e);} }, true);
    var sd=document.getElementById('plannerStartDate'); if(sd && !sd.value){ sd.value=todayISO(); }
  }

  function boot(){ try{ attach(); }catch(e){ console.error(e); } }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
