
/* Planner finale con overlay di avanzamento e capitalizzazione sicura */
(function(){
  // ------------------ COSTANTI ------------------
  var ITZ = 'Europe/Rome';
  var BRAND_BG_HEX = '#f6efe9';
  var ACCENT_HEX = '#2b5a44';

  // ------------------ UTILS ------------------

  // iOS / iPadOS detection (covers iPadOS with desktop UA)
  function isIOSMobile(){
    var ua = navigator.userAgent || '';
    var iOS = /iPad|iPhone|iPod/.test(ua);
    var isAppleTouch = /Mac/i.test(ua) && ('ontouchend' in document);
    return iOS || isAppleTouch;
  }
  function capFirst(s){
    var t = (s == null ? '' : String(s));
    if(!t) return '';
    return t.charAt(0).toLocaleUpperCase('it-IT') + t.slice(1);
  }
  function todayISO(){ return new Date().toLocaleDateString('en-CA', {timeZone: ITZ}); }
  function addDays(iso, n){ var d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate()+n); return d.toLocaleDateString('en-CA', {timeZone: ITZ}); }
  function fmtDate(iso){
    return new Date(iso+'T00:00:00').toLocaleDateString(
      document.documentElement.lang || 'it-IT',
      {weekday:'long', day:'2-digit', month:'2-digit'}
    );
  }
  function fmtDateCap(iso){ return capFirst(fmtDate(iso)); }
  function choice(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function hexToRgb(hex){
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex||'').trim());
    if(!m) return {r:246,g:239,b:233};
    return { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) };
  }

  // ------------------ CSS (UI + OVERLAY) ------------------
  function injectCSS(){
    if(document.getElementById('planner-final-css')) return;
    var s = document.createElement('style'); s.id = 'planner-final-css';
    s.textContent = [
      "/* Planner UI */",
      "#planner .planner-hero{margin-bottom:12px}",
      "#planner .planner-form.card{padding:14px}",
      "#planner .form-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-bottom:10px}",
      "#planner .field .label{display:block;font-weight:600;margin-bottom:6px}",
      "#planner .fieldset-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}",
      "@media (max-width:900px){#planner .fieldset-row{grid-template-columns:1fr}}",
      "#planner fieldset{border:0;margin:0;padding:0}",
      "#planner .segmented,#planner .chips{display:flex;flex-wrap:wrap;gap:10px}",
      "#planner .segmented legend,#planner .chips legend{width:100%;font-weight:600;margin-bottom:6px}",
      "#planner input[type='text'],#planner input[type='date'],#planner select{appearance:none;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:999px;padding:8px 12px;height:38px;line-height:22px;box-shadow:0 1px 0 rgba(0,0,0,.02)}",
      "#planner input[type='text']:focus,#planner input[type='date']:focus,#planner select:focus{outline:none;border-color:var(--brand-2,#2b5a44);box-shadow:0 0 0 3px rgba(43,90,68,.12)}",
      "#planner .chip{display:inline-flex;align-items:center;gap:8px;cursor:pointer;user-select:none}",
      "#planner .chip input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}",
      "#planner .chip span{display:inline-flex;align-items:center;gap:8px;font-weight:600;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:999px;padding:8px 12px;transition:border-color .15s ease,box-shadow .15s ease}",
      "#planner .chip input:checked + span{border:2px solid var(--brand-2,#2b5a44);box-shadow:0 0 0 3px rgba(43,90,68,.10)}",
      "/* Overlay */",
      "#planner-progress{position:fixed;inset:0;background:rgba(0,0,0,.28);backdrop-filter:blur(2px);display:none;align-items:center;justify-content:center;z-index:9999}",
      "#planner-progress.open{display:flex}",
      "#planner-progress .box{background:#fff;border-radius:16px;padding:16px 18px;width:min(420px,92vw);box-shadow:0 12px 40px rgba(0,0,0,.25)}",
      "#planner-progress .head{display:flex;align-items:center;gap:10px;margin-bottom:10px}",
      "#planner-progress .spinner{width:22px;height:22px;border:3px solid #e5e5e5;border-top-color:var(--brand-2,#2b5a44);border-radius:50%;animation:spin 1s linear infinite}",
      "@keyframes spin{to{transform:rotate(360deg)}}",
      "#planner-progress .label{font-weight:600}",
      "#planner-progress .bar{height:10px;background:#eee;border-radius:9999px;overflow:hidden}",
      "#planner-progress .bar i{display:block;height:100%;width:0%;background:var(--brand-2,#2b5a44);transition:width .2s ease}"
    ].join("\n");
    document.head.appendChild(s);
  }

  // ------------------ OVERLAY ------------------
  var PlannerProgress = {
    _ui:null,_cur:0,_tot:1,
    _ensure:function(){
      injectCSS();
      if(!this._ui){
        var w = document.createElement('div');
        w.id = 'planner-progress';
        w.innerHTML = '<div class="box">'+
          '<div class="head"><div class="spinner"></div><div class="label">Preparazione…</div></div>'+
          '<div class="bar"><i></i></div>'+
        '</div>';
        document.body.appendChild(w);
        this._ui = { wrap:w, bar:w.querySelector('.bar i'), label:w.querySelector('.label') };
      }
      return this._ui;
    },
    init:function(total){ this._ensure(); this._tot = Math.max(1, total||1); this._cur = 0; this._render('Preparazione…', 0); },
    _render:function(label, n){ var ui=this._ensure(); var pct=Math.min(99, Math.round((n/Math.max(1,this._tot))*100)); ui.bar.style.width = pct + '%'; if(label) ui.label.textContent = label; },
    start:function(label){ this._ensure().wrap.classList.add('open'); this._cur = 0; this._render(label || 'Avvio…', 0); },
    step:function(label){ this._cur++; this._render(label, this._cur); },
    set:function(n,label){ this._cur = Math.max(0, Math.min(this._tot, n)); this._render(label, this._cur); },
    finish:function(){ var ui=this._ensure(); ui.bar.style.width='100%'; ui.label.textContent='Completato'; setTimeout(function(){ ui.wrap.classList.remove('open'); }, 400); },
    error:function(msg){ var ui=this._ensure(); ui.wrap.classList.add('open'); ui.bar.style.width='0%'; ui.label.textContent = msg || 'Errore'; }
  };
  window.PlannerProgress = PlannerProgress;

  // ------------------ DATA ------------------
  var STATE = {doItems:null, eatItems:null, eatHours:null};
  function loadJSON(path){
    return fetch(path, {cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); });
  }
  function ensureLocalData(){
    var p = [];
    if(!STATE.doItems){
      p.push(loadJSON('assets/do.json').then(function(d){
        var out = [];
        if(d && d.categories){ d.categories.forEach(function(c){ (c.items||[]).forEach(function(x){ out.push(Object.assign({_cat:(c.slug||c.name)}, x)); }); }); }
        STATE.doItems = out;
      }).catch(function(){ STATE.doItems = []; }));
    }
    if(!STATE.eatItems){
      p.push(loadJSON('assets/eat.json').then(function(e){
        var out = [];
        if(e && e.categories){ e.categories.forEach(function(c){ (c.items||[]).forEach(function(x){ out.push(Object.assign({_cat:(c.slug||c.name)}, x)); }); }); }
        STATE.eatItems = out;
      }).catch(function(){ STATE.eatItems = []; }));
    }
    if(STATE.eatHours === null || STATE.eatHours === undefined){
      p.push(loadJSON('assets/eat-hours.json').then(function(h){ STATE.eatHours = h || {}; }).catch(function(){ STATE.eatHours = {}; }));
    }
    return Promise.all(p);
  }

  function fetchWeather(startISO, endISO){
    var lat=45.156, lon=10.791;
    var url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: lat, longitude: lon, timezone: ITZ,
      daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      start_date: startISO, end_date: endISO
    }).toString();
    return fetch(url.toString()).then(function(res){
      if(!res.ok) throw 0; return res.json();
    }).then(function(j){
      var out = []; var n = (j.daily && j.daily.time ? j.daily.time.length : 0);
      for(var i=0;i<n;i++){
        out.push({
          date: j.daily.time[i],
          tmin: j.daily.temperature_2m_min[i],
          tmax: j.daily.temperature_2m_max[i],
          pprob: j.daily.precipitation_probability_max[i],
          wcode: j.daily.weathercode[i]
        });
      }
      return out;
    }).catch(function(){
      // fallback offline
      var days = Math.round((new Date(endISO)-new Date(startISO))/86400000) + 1;
      var arr = []; for(var k=0;k<days;k++){ arr.push({date:addDays(startISO,k), tmin:20, tmax:30, pprob:10, wcode:1}); } return arr;
    });
  }

  var WMAP = {0:'Sereno',1:'Perlopiù sereno',2:'Parz. nuvoloso',3:'Nuvoloso',45:'Nebbia',48:'Nebbia gelata',51:'Pioviggine leggera',53:'Pioviggine',55:'Pioviggine intensa',61:'Pioggia leggera',63:'Pioggia',65:'Pioggia intensa',66:'Pioggia gelata',67:'Pioggia gelata forte',71:'Neve leggera',73:'Neve',75:'Neve intensa',80:'Rovesci leggeri',81:'Rovesci',82:'Rovesci forti',95:'Temporali',96:'Temporali con grandine',99:'Temporali forti'};

  function pickActivities(interests){
    var pools = {
      arte: STATE.doItems.filter(function(x){ return /Palazzo|Museo|Duomo|Basilica|Castello|Teatro|Rotonda|Sinagoga|Palazzo Te|Camera degli Sposi/i.test(x.name||''); }),
      natura: STATE.doItems.filter(function(x){ return /Parco|Lago|Ciclabile|Giardino|Mincio|Bosco|Escursioni|Peschiera/i.test(x.name||''); }),
      enogastronomia: STATE.doItems.filter(function(x){ return /Degust|Azienda|Enoteca|Cantina|Aceto|Zafferano|Apicoltura|Osteria|Trattoria|Ristorante/i.test(x.name||''); }),
      relax: STATE.doItems.filter(function(x){ return /Massaggi|Term|Spa|Benessere/i.test(x.name||''); })
    };
    if(pools.relax.length === 0) pools.relax = STATE.doItems.filter(function(x){ return /Parco|Giardino/i.test(x.name||''); });
    return pools;
  }
  function chooseRestaurant(){
    var r = (STATE.eatItems && STATE.eatItems.length) ? choice(STATE.eatItems) : {name:'Ristorante consigliato', address:'Mantova Centro'};
    var hours = STATE.eatHours && STATE.eatHours[r.name] ? STATE.eatHours[r.name] : null;
    return Object.assign({}, r, {hours: hours});
  }

  function buildDayPlan(dateISO, weather, interests, used){
    var pools = pickActivities(interests);
    function pickFrom(key){
      var pool = pools[key].filter(function(x){ return !used[x.name]; });
      var p = pool.length ? choice(pool) : ((STATE.doItems && STATE.doItems[0]) || {name:'Passeggiata in centro', address:'Mantova'});
      used[p.name] = true;
      return p;
    }
    var wet = (weather.pprob || 0) >= 50;
    var hot = (weather.tmax || 0) >= 31;
    var am, pm;
    if(wet){ am = interests.indexOf('arte')>-1 ? pickFrom('arte') : pickFrom('enogastronomia');
             pm = interests.indexOf('enogastronomia')>-1 ? pickFrom('enogastronomia') : (interests.indexOf('arte')>-1 ? pickFrom('arte') : pickFrom('natura')); }
    else if(hot){ am = interests.indexOf('natura')>-1 ? pickFrom('natura') : pickFrom('arte');
                  pm = interests.indexOf('arte')>-1 ? pickFrom('arte') : pickFrom('enogastronomia'); }
    else { am = interests.indexOf('natura')>-1 ? pickFrom('natura') : pickFrom('arte');
           pm = interests.indexOf('arte')>-1 ? pickFrom('arte') : pickFrom('enogastronomia'); }
    var dinner = chooseRestaurant();
    return { date: dateISO, weather: weather, am: am, pm: pm, dinner: dinner };
  }

  // ------------------ LIBRERIE PDF ------------------
  function loadScript(src){
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function ensurePDFLibs(){
    var p = Promise.resolve();
    if(!window.jspdf){
      p = p.then(function(){ return loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'); })
           .catch(function(){ return loadScript('assets/vendor/jspdf.umd.min.js'); });
    }
    if(!window.html2canvas){
      p = p.then(function(){ return loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'); })
           .catch(function(){ return loadScript('assets/vendor/html2canvas.min.js'); });
    }
    return p;
  }

  function pickLogo(){ return 'assets/logo.jpg'; }

  // ------------------ RENDER HTML->CANVAS ------------------
  function htmlToCanvas(html){
    var holder = document.createElement('div');
    holder.style.position='fixed'; holder.style.left='-10000px'; holder.style.top='0'; holder.style.zIndex='-1';
    holder.innerHTML = html; document.body.appendChild(holder);
    var node = holder.querySelector('.pdf-root') || holder;
    return window.html2canvas(node, {scale: (isIOSMobile()?1:2), useCORS:true, imageTimeout:15000, backgroundColor: BRAND_BG_HEX})
      .then(function(canvas){ holder.remove(); return canvas; })
      .catch(function(err){ holder.remove(); throw err; });
  }

  function pdfFillBg(pdf, color){
    var w = pdf.internal.pageSize.getWidth();
    var h = pdf.internal.pageSize.getHeight();
    pdf.setFillColor(color.r, color.g, color.b); pdf.rect(0,0,w,h,'F');
  }
  function getLogoDataUrl(){
    return new Promise(function(resolve){
      var img = new Image(); img.crossOrigin='anonymous';
      img.onload = function(){ try{ var c=document.createElement('canvas'); c.width=c.height=64; c.getContext('2d').drawImage(img,0,0,64,64); resolve(c.toDataURL('image/png')); }catch(e){ resolve(null);} };
      img.onerror = function(){ resolve(null); };
      img.src = pickLogo();
    });
  }
  function renderFooters(pdf, total, pageWidth, pageHeight, logoUrl){
    var margin = 8;
    var dateStr = new Date().toLocaleDateString('it-IT', {day:'2-digit', month:'2-digit', year:'numeric'});
    for(var p=1;p<=total;p++){
      pdf.setPage(p);
      pdf.setFontSize(9); pdf.setTextColor(40,40,40);
      pdf.text('Pagina '+p+' di '+total, pageWidth/2, pageHeight - margin, {align:'center'});
      pdf.text(dateStr, pageHeight ? pageWidth - margin : pageWidth - margin, pageHeight - margin, {align:'right'});
      if(logoUrl){ var sz=10; pdf.addImage(logoUrl, 'PNG', margin, pageHeight - margin - sz + 2, sz, sz); }
    }
  }

  // ------------------ TEMPLATES PDF ------------------
  var baseCSS = [
    ".pdf-root{width:794px;padding:16px;font-family:inherit;color:#111;background:"+BRAND_BG_HEX+"}",
    ".planner-head{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:10px}",
    ".planner-logo{width:100px;height:auto;border-radius:12px}",
    ".planner-weather-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:12px}",
    ".pw-item{padding:10px;border:1px solid rgba(0,0,0,.08);border-radius:12px;background:#fff}",
    ".planner-day{background:#fff;border-radius:12px;padding:12px;border:1px solid rgba(0,0,0,.08)}",
    ".planner-day header{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px}",
    ".planner-day .slots{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
    ".planner-day .slots .dinner{grid-column:1/-1}",
    ".slot-title{font-weight:600;margin-bottom:6px}",
    ".tag{background:"+ACCENT_HEX+";color:#fff;padding:4px 8px;border-radius:999px;font-size:.85rem}",
    ".muted{opacity:.8}"
  ].join("\n");

  function buildHeaderHTML(name, meteoDays){
    var safe = capFirst((name||'Ospite').trim());
    var weather = (meteoDays||[]).map(function(d){
      return '<div class="pw-item">'+
        '<div class="pw-date">'+fmtDateCap(d.date)+'</div>'+
        '<div class="pw-cond">'+(WMAP[d.wcode]||'—')+'</div>'+
        '<div class="pw-temp">Min '+Math.round(d.tmin)+'° / Max '+Math.round(d.tmax)+'°</div>'+
        '<div class="pw-pp">Pioggia '+(d.pprob==null?'—':d.pprob)+'%</div>'+
      '</div>';
    }).join('');
    return '<style>'+baseCSS+'</style>'+
      '<div class="pdf-root">'+
        '<div class="planner-head">'+
          '<img class="planner-logo" src="'+pickLogo()+'" alt="Corte San Girolamo" />'+
          '<div><h2>Itinerario per '+safe+'</h2><p class="muted">Generato in base a meteo, interessi e durata.</p></div>'+
        '</div>'+
        '<h3 style="margin:.4rem 0;">Meteo Mantova</h3>'+
        '<div class="planner-weather-list">'+weather+'</div>'+
      '</div>';
  }
  function buildDayHTML(day){
    return '<style>'+baseCSS+'</style>'+
      '<div class="pdf-root">'+
        '<article class="planner-day">'+
          '<header>'+
            '<h4>'+fmtDateCap(day.date)+'</h4>'+
            '<div class="tag">'+(WMAP[day.weather.wcode]||'')+' · '+Math.round(day.weather.tmin)+'°–'+Math.round(day.weather.tmax)+'° · Pioggia '+day.weather.pprob+'%</div>'+
          '</header>'+
          '<section class="slots">'+
            '<div class="slot"><div class="slot-title">Mattina</div><div class="slot-body"><strong>'+day.am.name+'</strong><br/><small>'+(day.am.address||'')+'</small></div></div>'+
            '<div class="slot"><div class="slot-title">Pomeriggio</div><div class="slot-body"><strong>'+day.pm.name+'</strong><br/><small>'+(day.pm.address||'')+'</small></div></div>'+
            '<div class="slot dinner"><div class="slot-title">Cena · Ristorante consigliato</div><div class="slot-body"><strong>'+day.dinner.name+'</strong><br/><small>'+(day.dinner.address||'')+'</small><div class="hours">'+(day.dinner.hours?('Orari: '+day.dinner.hours):'Orari: consulta il sito/telefono per conferma')+'</div></div></div>'+
          '</section>'+
        '</article>'+
      '</div>';
  }

  // ------------------ GENERAZIONE PDF ------------------
  function serializePrefs(){
    var form = document.getElementById('plannerForm');
    var fd = new FormData(form);
    var name = capFirst(String(fd.get('name') || ''));
    var days = Math.max(1, Math.min(7, parseInt(fd.get('days') || '3', 10)));
    var ints = []; Array.prototype.forEach.call(form.querySelectorAll('input[name="interests"]:checked'), function(i){ ints.push(i.value); });
    var start = (document.getElementById('plannerStartDate') && document.getElementById('plannerStartDate').value) || todayISO();
    if(!ints.length) ints = ['arte','natura','enogastronomia'];
    return { name:name, days:days, interests:ints, start:start };
  }

  function generatePDF(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    var btn = document.getElementById('plannerGenerate'); if(btn){ btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }

    PlannerProgress.init(6); PlannerProgress.start('Preparazione…');

    ensureLocalData().then(function(){
      PlannerProgress.step('Dati locali…');
      var prefs = serializePrefs();
      var start = prefs.start, end = addDays(start, prefs.days-1);
      return fetchWeather(start, end).then(function(meteo){
        PlannerProgress.step('Meteo Mantova…');
        return ensurePDFLibs().then(function(){
          PlannerProgress.step('Librerie pronte…');
          var jsPDF = window.jspdf.jsPDF;
          var pdf = new jsPDF('p','mm','a4');
          var pageWidth = pdf.internal.pageSize.getWidth();
          var pageHeight = pdf.internal.pageSize.getHeight();
          var IMG_FMT = isIOSMobile() ? 'JPEG' : 'PNG';
          function TO_DATAURL(c){ try{ return isIOSMobile()? c.toDataURL('image/jpeg',0.85) : c.toDataURL('image/png'); }catch(e){ return c.toDataURL('image/jpeg',0.85); } }

          pdfFillBg(pdf, hexToRgb(BRAND_BG_HEX));

          return htmlToCanvas(buildHeaderHTML(prefs.name, meteo)).then(function(headerCanvas){
            PlannerProgress.step('Impagino intestazione…');
            var y = 0, w = pageWidth, h = (headerCanvas.height * w) / Math.max(1, headerCanvas.width);
            try{ pdf.addImage(headerCanvas, IMG_FMT, 0, y, w, h, undefined, 'FAST'); }catch(e){ pdf.addImage(TO_DATAURL(headerCanvas), IMG_FMT, 0, y, w, h, undefined, 'FAST'); }
            y += h + 4;

            var used = {};
            var seq = Promise.resolve();
            for(let i=0;i<prefs.days;i++){
              (function(idx){
                seq = seq.then(function(){
                  var dISO = addDays(start, idx);
                  var wobj = meteo.filter(function(x){ return x.date === dISO; })[0] || meteo[0] || {tmin:0,tmax:0,pprob:0,wcode:0};
                  var day = buildDayPlan(dISO, wobj, prefs.interests, used);
                  return htmlToCanvas(buildDayHTML(day)).then(function(cardCanvas){
                    var cW = pageWidth, cH = (cardCanvas.height * cW) / Math.max(1, cardCanvas.width);
                    if(y + cH > pageHeight){ pdf.addPage(); pdfFillBg(pdf, hexToRgb(BRAND_BG_HEX)); y = 0; }
                    pdf.addImage(cardCanvas.toDataURL('image/png'), IMG_FMT, 0, y, cW, cH);
                    y += cH + 4;
                    PlannerProgress.step('Giorno '+(idx+1)+'/'+prefs.days+'…');
                  });
                });
              })(i);
            }

            return seq.then(function(){
              var total = pdf.getNumberOfPages();
              return getLogoDataUrl().then(function(logoUrl){
                renderFooters(pdf, total, pageWidth, pageHeight, logoUrl);
                PlannerProgress.step('Finalizzazione…');
                var fname = 'Planner_'+ (prefs.name||'Ospite').replace(/[^a-z0-9-_]+/gi,'_') +'_'+ start +'_'+ prefs.days +'gg.pdf';
                pdf.save(fname);
                PlannerProgress.finish();
              });
            });
          });
        });
      });
    }).catch(function(err){
      console.error(err);
      PlannerProgress.error('Errore durante la generazione');
      alert('Errore PDF: ' + (err && err.message ? err.message : err));
    }).finally(function(){
      if(btn){ btn.disabled = false; btn.removeAttribute('aria-busy'); }
    });
  }

  // ------------------ WIRING ------------------
  function attachHandlers(){
    injectCSS();
    var form = document.getElementById('plannerForm');
    var btn = document.getElementById('plannerGenerate');
    if(!form || !btn) return;
    btn.setAttribute('type','button');
    form.setAttribute('novalidate','novalidate');
    form.addEventListener('submit', function(e){ e.preventDefault(); e.stopPropagation(); generatePDF(e); }, true);
    btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); generatePDF(e); });
    var sd = document.getElementById('plannerStartDate'); if(sd && !sd.value){ sd.value = todayISO(); }
  }

  function boot(){ try{ attachHandlers(); }catch(e){ console.error(e); } }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
