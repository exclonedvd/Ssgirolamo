/* Planner vector-cards (wrap text, dynamic card height) — FIX */
(function(){
  var ITZ='Europe/Rome';
  var BRAND_BG={r:246,g:239,b:233};
  var ACCENT={r:43,g:90,b:68};
  var CARD_BG={r:255,g:255,b:255};
  var TEXT_MUTED={r:60,g:60,b:60};
  var MARGIN=8, GAP=6, PADDING=5, LINE=5.2;

  function capFirst(s){ var t=(s==null?'':String(s)); return t ? t.charAt(0).toLocaleUpperCase('it-IT') + t.slice(1) : ''; }
  function todayISO(){ return new Date().toLocaleDateString('en-CA',{timeZone:ITZ}); }
  function addDays(iso,n){ var d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toLocaleDateString('en-CA',{timeZone:ITZ}); }
  function fmtDateCap(iso){ try{var d=new Date(iso+'T00:00:00'); return d.toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long'}).replace(/^./,function(c){return c.toUpperCase();});}catch(e){return iso;} }

  function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function ensurePDF(){ if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve(); return loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js').catch(function(){ return loadScript('assets/vendor/jspdf.umd.min.js'); }); }

  function injectCSS(){
    if(document.getElementById('planner-css-cards-wrap')) return;
    var s=document.createElement('style'); s.id='planner-css-cards-wrap';
    s.textContent=[
      "#planner-progress{position:fixed;left:0;top:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.28);backdrop-filter:blur(2px);z-index:99999}",
      "#planner-progress.open{display:flex}",
      "#planner-progress .box{min-width:260px;max-width:90vw;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.2);padding:14px 16px}",
      "#planner-progress .head{display:flex;align-items:center;gap:8px;margin-bottom:10px}",
      "#planner-progress .head .spinner{width:16px;height:16px;border:2px solid #2b5a44;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite}",
      "#planner-progress .head .label{font-weight:600}",
      "#planner-progress .bar{background:#eee;height:8px;border-radius:999px;overflow:hidden}",
      "#planner-progress .bar i{display:block;height:100%;width:0;background:#2b5a44}",
      "@keyframes spin{to{transform:rotate(360deg)}}"
    ].join("");
    document.head.appendChild(s);
  }

  var Progress={ _ui:null,_cur:0,_tot:1,
    _ensure:function(){ injectCSS(); if(this._ui) return this._ui; var w=document.createElement('div'); w.id='planner-progress'; w.innerHTML='<div class="box"><div class="head"><div class="spinner"></div><div class="label">Preparazione…</div></div><div class="bar"><i></i></div></div>'; document.body.appendChild(w); this._ui={wrap:w,bar:w.querySelector('.bar i'),label:w.querySelector('.label')}; return this._ui; },
    init:function(t){ this._ensure(); this._tot=Math.max(1,t||1); this._cur=0; this._render('Preparazione…',0); },
    _render:function(l,n){ var ui=this._ensure(); var pct=Math.round(100*(n/Math.max(1,this._tot))); ui.bar.style.width=pct+'%'; if(l) ui.label.textContent=l; },
    start:function(l){ this._ensure().wrap.classList.add('open'); this._cur=0; this._render(l||'Avvio…',0); },
    step:function(l){ this._cur++; this._render(l,this._cur); },
    finish:function(){ var ui=this._ensure(); this._render('Fatto',this._tot); setTimeout(function(){ ui.wrap.classList.remove('open'); }, 500); },
    error:function(l){ var ui=this._ensure(); ui.label.textContent=l||'Errore'; ui.bar.style.width='0%'; ui.wrap.classList.add('open'); }
  };

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
    var form=document.getElementById('plannerForm');
    if(!form) return {name:'',days:3,interests:['arte','natura','enogastronomia'],start:todayISO()};
    var fd=new FormData(form);
    var name=capFirst(String(fd.get('name')||''));
    var days=Math.max(1, Math.min(7, parseInt(fd.get('days')||'3',10)));
    var ints=[]; form.querySelectorAll('input[name="interests"]:checked').forEach(function(i){ints.push(i.value);});
    var start=(document.getElementById('plannerStartDate') && document.getElementById('plannerStartDate').value) || todayISO();
    if(!ints.length) ints=['arte','natura','enogastronomia'];
    return {name:name,days:days,interests:ints,start:start};
  }

  // Weather icons (vector)
  function iconType(wcode){ if(wcode==null) return 'na'; if([0,1].includes(wcode)) return 'sun'; if([2,3].includes(wcode)) return 'partly'; if([45,48,51,53,55,56,57,80,81,82].includes(wcode)) return 'rain'; if([61,63,65].includes(wcode)) return 'rain'; return 'cloud'; }
  function drawSun(pdf,x,y){ pdf.setFillColor(255,191,0); pdf.circle(x,y,3,'F'); pdf.setDrawColor(255,191,0); pdf.setLineWidth(0.6); for(var a=0;a<8;a++){ var ang=a*Math.PI/4; pdf.line(x+4*Math.cos(ang), y+4*Math.sin(ang), x+6.2*Math.cos(ang), y+6.2*Math.sin(ang)); } }
  function drawCloud(pdf,x,y){ pdf.setFillColor(200,200,200); pdf.circle(x-2,y,2.2,'F'); pdf.circle(x+0.8,y-1.2,2.8,'F'); pdf.circle(x+3.6,y,2.2,'F'); pdf.rect(x-4.6,y,9.2,3,'F'); }
  function drawRain(pdf,x,y){ drawCloud(pdf,x,y); pdf.setDrawColor(60,130,200); pdf.setLineWidth(0.7); pdf.line(x-2.5,y+3.8,x-3.2,y+5.8); pdf.line(x,y+3.8,x-0.7,y+5.8); pdf.line(x+2.5,y+3.8,x+1.8,y+5.8); }
  function drawPartly(pdf,x,y){ drawCloud(pdf,x+1,y); drawSun(pdf,x-3.8,y-1.2); }
  function drawIcon(pdf,type,x,y){ if(type==='sun') drawSun(pdf,x,y); else if(type==='partly') drawPartly(pdf,x,y); else if(type==='rain') drawRain(pdf,x,y); else drawCloud(pdf,x,y); }

  function getLogoDataUrl(){ return new Promise(function(resolve){ var img=new Image(); img.crossOrigin='anonymous'; img.onload=function(){ try{ var c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight; var ctx=c.getContext('2d'); ctx.drawImage(img,0,0); resolve(c.toDataURL('image/jpeg',0.9)); }catch(e){ resolve(null); } }; img.onerror=function(){ resolve(null); }; img.src='assets/logo.jpg'; }); }

  function wrapLines(pdf, text, maxWidth){
    pdf.setLineHeightFactor(1.15);
    try{
      return pdf.splitTextToSize(String(text||''), maxWidth);
    }catch(e){
      // fallback manual split
      var out=[], words=String(text||'').split(' '), cur='';
      for(var i=0;i<words.length;i++){
        var t=words[i], tmp=cur? (cur+' '+t):t;
        try{ if(pdf.getTextWidth(tmp)>maxWidth && cur){ out.push(cur); cur=t; } else { cur=tmp; } }
        catch(_){ cur=tmp; }
      }
      if(cur) out.push(cur);
      return out;
    }
  }

  function generatePDF(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    try{
      var btn=document.getElementById('plannerGenerate'); if(btn){ btn.disabled=true; btn.setAttribute('aria-busy','true'); }
      Progress.init(7); Progress.start('Preparazione…');

      var prefs=serializePrefs();
      var startISO=prefs.start, endISO=addDays(startISO, prefs.days-1);

      Promise.all([ ensurePDF(), loadJSON('assets/do.json'), loadJSON('assets/eat.json'), fetchWeather(startISO,endISO), getLogoDataUrl() ])
      .then(function(arr){
        Progress.step('Dati pronti…');
        var jsPDF=window.jspdf.jsPDF;
        var pdf=new jsPDF('p','mm','a4');
        var pw=pdf.internal.pageSize.getWidth();
        var ph=pdf.internal.pageSize.getHeight();
        var usableW = pw - 2*MARGIN;

        var vedere=(arr[1].categories.find(function(c){return c.slug==='vedere';})||{}).items||[];
        var esc=(arr[1].categories.find(function(c){return c.slug==='escursioni';})||{}).items||[];
        var prov=(arr[1].categories.find(function(c){return c.slug==='provare';})||{}).items||[];
        var food=(arr[2].categories.find(function(c){return c.slug==='tradizione';})||{}).items||[]; if(!food.length) food=(arr[2].categories[0]||{}).items||[];
        var meteo=arr[3]||[];
        var logo=arr[4];

        // Background
        pdf.setFillColor(BRAND_BG.r,BRAND_BG.g,BRAND_BG.b); pdf.rect(0,0,pw,ph,'F');

        // Header with logo
        var y=12; pdf.setDrawColor(ACCENT.r,ACCENT.g,ACCENT.b); pdf.setLineWidth(0.8);
        if(logo){ try{ pdf.addImage(logo,'JPEG', pw-28, 8, 18, 18); }catch(e){} }
        pdf.line(MARGIN,12,pw-MARGIN,12);
        pdf.setTextColor(0,0,0);
        pdf.setFontSize(18); var safe=capFirst((prefs.name||'Ospite').trim()); pdf.text('Itinerario per '+safe, MARGIN, 20);
        pdf.setFontSize(11); pdf.text('Periodo: '+fmtDateCap(startISO)+' – '+fmtDateCap(endISO), MARGIN, 26);

        // Meteo strip
        if(meteo.length){
          y=32; pdf.setFontSize(10); pdf.setTextColor(0,0,0);
          var cols=Math.min(meteo.length,5), colW=(usableW)/cols;
          for(var mi=0; mi<cols; mi++){
            var d=meteo[mi], x=MARGIN + mi*colW;
            drawIcon(pdf, iconType(d.wcode), x+5, y-1);
            pdf.text(Math.round(d.tmax)+'°/'+Math.round(d.tmin)+'°', x+12, y);
            pdf.text((d.pprob==null?'—':String(d.pprob)+'%'), x+12, y+5);
            pdf.text(fmtDateCap(d.date), x, y+10);
          }
          y+=18;
        }else{ y=34; }

        // Cards with wrapping
        var used={};
        var cardW=usableW;
        for(var di=0; di<prefs.days; di++){
          var matt = pick(vedere.concat(prov), used);
          var pom = pick(esc.concat(vedere), used);
          var sera = pick(food, used);
          var labelMatt='Mattina:  ';
          var labelPom='Pomeriggio:  ';
          var labelCena='Cena:  ';

          var textMatt = (matt.name||'') + (matt.address? ' — '+matt.address : '') + (matt.phone? ' — '+matt.phone : '');
          var textPom  = (pom.name||'')  + (pom.address?  ' — '+pom.address  : '') + (pom.phone?  ' — '+pom.phone  : '');
          var textCena = (sera.name||'') + (sera.address? ' — '+sera.address : '') + (sera.phone? ' — '+sera.phone : '');

          var innerW = cardW - 2*PADDING - 6;
          pdf.setFontSize(11); pdf.setTextColor(TEXT_MUTED.r,TEXT_MUTED.g,TEXT_MUTED.b);
          var l1 = wrapLines(pdf, labelMatt + textMatt, innerW);
          var l2 = wrapLines(pdf, labelPom  + textPom,  innerW);
          var l3 = wrapLines(pdf, labelCena + textCena, innerW);
          var linesCount = l1.length + l2.length + l3.length;
          var headerH = 11; // title row height
          var contentH = Math.max(1, linesCount) * LINE + 4;
          var cardH = Math.max(40, headerH + contentH + PADDING*2);

          if(y + cardH > ph - 12){
            pdf.addPage();
            pdf.setFillColor(BRAND_BG.r,BRAND_BG.g,BRAND_BG.b); pdf.rect(0,0,pw,ph,'F');
            y=12;
          }

          pdf.setDrawColor(220); pdf.setFillColor(CARD_BG.r,CARD_BG.g,CARD_BG.b);
          if(pdf.roundedRect){ pdf.roundedRect(MARGIN,y,cardW,cardH,3,3,'FD'); } else { pdf.rect(MARGIN,y,cardW,cardH,'FD'); }

          pdf.setDrawColor(ACCENT.r,ACCENT.g,ACCENT.b); pdf.setLineWidth(0.5); pdf.line(MARGIN+2, y+9, MARGIN+cardW-2, y+9);
          pdf.setTextColor(0,0,0); pdf.setFontSize(13);
          pdf.text((di+1)+'. '+fmtDateCap(addDays(startISO,di)), MARGIN+PADDING, y+6);
          var wd=(meteo[di]||{}); drawIcon(pdf, iconType(wd.wcode), MARGIN+cardW-8, y+6);

          pdf.setTextColor(TEXT_MUTED.r,TEXT_MUTED.g,TEXT_MUTED.b); pdf.setFontSize(11);
          var cx = MARGIN+PADDING; var cy = y + headerH + PADDING + 2;
          l1.forEach(function(line){ pdf.text(line, cx, cy); cy += LINE; });
          l2.forEach(function(line){ pdf.text(line, cx, cy); cy += LINE; });
          l3.forEach(function(line){ pdf.text(line, cx, cy); cy += LINE; });

          y += cardH + GAP;
          Progress.step('Giorno '+(di+1)+'/'+prefs.days+'…');
        }

        pdf.setTextColor(120); pdf.setFontSize(9);
        pdf.text('Corte San Girolamo · Itinerario generato automaticamente', MARGIN, ph-6);

        Progress.step('Salvataggio…');
        var fname='Itinerario_'+(prefs.name||'Ospite').replace(/[^a-z0-9-_]+/gi,'_')+'_'+startISO+'_'+prefs.days+'gg.pdf';
        pdf.save(fname);
        Progress.finish();
      }).catch(function(err){
        console.error(err); Progress.error('Errore'); alert('Errore PDF: '+(err&&err.message?err.message:err));
      }).finally(function(){ var btn=document.getElementById('plannerGenerate'); if(btn){ btn.disabled=false; btn.removeAttribute('aria-busy'); } });
    }catch(err){
      console.error(err); Progress.error('Errore'); alert('Errore PDF: '+(err&&err.message?err.message:err));
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

  function boot(){ try{ injectCSS(); attach(); }catch(e){ console.error(e); } }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
