/* Planner ES5 mobile-safe: pills + tel, save/share panel, robust fallbacks (v15) */
(function(){
  var ITZ='Europe/Rome';
  var BRAND_BG={r:246,g:239,b:233};
  var ACCENT={r:43,g:90,b:68};
  var CARD_BG={r:255,g:255,b:255};
  var TEXT_MUTED={r:60,g:60,b:60};
  var MARGIN=8, GAP=6, PADDING=6, LINE=5.4;

  function capFirst(s){ var t=(s==null?'':String(s)); return t ? t.charAt(0).toLocaleUpperCase('it-IT') + t.slice(1) : ''; }
  function todayISO(){ return new Date().toLocaleDateString('en-CA',{timeZone:ITZ}); }
  function addDays(iso,n){ var d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toLocaleDateString('en-CA',{timeZone:ITZ}); }
  function fmtDateCap(iso){ try{var d=new Date(iso+'T00:00:00'); var s=d.toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long'}); return s.replace(/^./, function(c){return c.toUpperCase();}); }catch(e){return iso;} }

  function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function ensurePDF(){ if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve(); return loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js').catch(function(){ return loadScript('assets/vendor/jspdf.umd.min.js'); }); }

  function injectCSS(){
    if(document.getElementById('planner-css-es5')) return;
    var s=document.createElement('style'); s.id='planner-css-es5';
    s.textContent=[
      "#planner-progress{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.28);backdrop-filter:blur(2px);z-index:99999}",
      "#planner-progress.open{display:flex}",
      "#planner-progress .box{min-width:260px;max-width:90vw;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.2);padding:14px 16px}",
      "#planner-progress .head{display:flex;align-items:center;gap:8px;margin-bottom:10px}",
      "#planner-progress .head .spinner{width:16px;height:16px;border:2px solid #2b5a44;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite}",
      "#planner-progress .head .label{font-weight:600}",
      "#planner-progress .bar{background:#eee;height:8px;border-radius:999px;overflow:hidden}",
      "#planner-progress .bar i{display:block;height:100%;width:0;background:#2b5a44}",
      "@keyframes spin{to{transform:rotate(360deg)}}",
      "#planner-actions{position:fixed;left:0;right:0;bottom:0;transform:translateY(100%);transition:.25s ease;z-index:100000;font:500 14px system-ui,-apple-system,Segoe UI,Roboto}",
      "#planner-actions.open{transform:translateY(0)}",
      "#planner-actions .sheet{background:#fff;border-top-left-radius:16px;border-top-right-radius:16px;box-shadow:0 -6px 24px rgba(0,0,0,.25);padding:12px}",
      "#planner-actions .sheet h4{margin:4px 8px 12px;font-size:16px}",
      "#planner-actions .row{display:flex;gap:10px;justify-content:space-between}",
      "#planner-actions button{flex:1;padding:12px;border-radius:10px;border:0;background:#2b5a44;color:#fff}",
      "#planner-actions button.secondary{background:#e6eee9;color:#2b5a44}",
      "#planner-actions .close{margin-top:10px;display:block;width:100%;padding:10px;border:0;background:#f0f0f0;border-radius:10px}",
      "#planner-toast{position:fixed;right:8px;bottom:8px;background:#2b5a44;color:#fff;padding:6px 10px;border-radius:10px;z-index:99999;font:600 12px system-ui}"
    ].join("");
    document.head.appendChild(s);
  }

  var Progress={ _ui:null,_cur:0,_tot:1,
    _ensure:function(){ injectCSS(); if(this._ui) return this._ui; var w=document.createElement('div'); w.id='planner-progress'; w.innerHTML='<div class="box"><div class="head"><div class="spinner"></div><div class="label">Preparazione…</div></div><div class="bar"><i></i></div></div>'; document.body.appendChild(w); this._ui={wrap:w,bar:w.querySelector('.bar i'),label:w.querySelector('.label')}; return this._ui; },
    init:function(t){ this._ensure(); this._tot=Math.max(1,t||1); this._cur=0; this._render('Preparazione…',0); },
    _render:function(l,n){ var ui=this._ensure(); var pct=Math.round(100*(n/Math.max(1,this._tot))); ui.bar.style.width=pct+'%'; if(l) ui.label.textContent=l; },
    start:function(l){ this._ensure().wrap.classList.add('open'); this._cur=0; this._render(l||'Avvio…',0); },
    step:function(l){ this._cur++; this._render(l,this._cur); },
    finish:function(){ var ui=this._ensure(); this._render('Fatto',this._tot); setTimeout(function(){ ui.wrap.classList.remove('open'); }, 300); },
    error:function(l){ var ui=this._ensure(); ui.label.textContent=l||'Errore'; ui.bar.style.width='0%'; ui.wrap.classList.add('open'); }
  };

  function loadJSON(url){ return fetch(url).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }); }
  function withTimeout(p, ms){ return new Promise(function(res,rej){ var to=setTimeout(function(){ rej(new Error('timeout '+ms+'ms')); }, ms); p.then(function(v){ clearTimeout(to); res(v); }, function(e){ clearTimeout(to); rej(e); }); }); }
  function fetchWeather(startISO,endISO){
    var lat=45.156, lon=10.791;
    var url='https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&timezone='+encodeURIComponent(ITZ)+'&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&start_date='+startISO+'&end_date='+endISO;
    return withTimeout(fetch(url).then(function(r){ if(!r.ok) throw 0; return r.json(); }), 3000)
      .then(function(j){ var out=[], d=j.daily||{}; var n=(d.time||[]).length; for(var i=0;i<n;i++){ out.push({date:d.time[i], tmin:d.temperature_2m_min[i], tmax:d.temperature_2m_max[i], pprob:d.precipitation_probability_max[i], wcode:d.weathercode[i]}); } return out; })
      .catch(function(){ return []; });
  }

  function pick(items, used){
    for(var i=0;i<items.length;i++){
      var it=items[i], key=(it.name||'')+'|'+(it.address||'');
      if(!used[key]){ used[key]=1; return it; }
    }
    return items[0] || {name:'—'};
  }

  function serializePrefs(){
    var form=document.getElementById('plannerForm');
    if(!form) return {name:'',days:3,interests:['arte','natura','enogastronomia'],start:todayISO()};
    var fd=new FormData(form);
    var name=capFirst(String(fd.get('name')||''));
    var days=Math.max(1, Math.min(7, parseInt(fd.get('days')||'3',10)));
    var ints=[], inputs=form.querySelectorAll('input[name="interests"]:checked');
    for(var i=0;i<inputs.length;i++){ ints.push(inputs[i].value); }
    var sd=document.getElementById('plannerStartDate');
    var start=(sd && sd.value) || todayISO();
    if(!ints.length) ints=['arte','natura','enogastronomia'];
    return {name:name,days:days,interests:ints,start:start};
  }

  function drawPill(pdf, x, y, label){
    pdf.setFontSize(10);
    var padX=3, padY=2;
    var w = pdf.getTextWidth(label) + padX*2 + 2;
    var h = 10*0.45 + padY*2;
    pdf.setFillColor(ACCENT.r,ACCENT.g,ACCENT.b);
    if(pdf.roundedRect){ pdf.roundedRect(x, y-h+padY, w, h, 3, 3, 'F'); } else { pdf.rect(x, y-h+padY, w, h, 'F'); }
    pdf.setTextColor(255); pdf.text(label, x+padX+1, y);
    return w;
  }

  function wrapLines(pdf, text, maxWidth){
    pdf.setLineHeightFactor(1.15);
    try{ return pdf.splitTextToSize(String(text||''), maxWidth); }
    catch(e){
      var out=[], words=String(text||'').split(' '), cur='';
      for(var i=0;i<words.length;i++){
        var t=words[i], tmp=cur? (cur+' '+t):t;
        try{ if(pdf.getTextWidth(tmp)>maxWidth && cur){ out.push(cur); cur=t; } else { cur=tmp; } }catch(_){ cur=tmp; }
      }
      if(cur) out.push(cur);
      return out;
    }
  }

  function renderSegment(pdf, x, y, cardW, pillLabel, timeLabel, text, phone, makeTelLink){
    var pillW = drawPill(pdf, x, y, pillLabel);
    var gap = 3;
    pdf.setTextColor(0,0,0); pdf.setFontSize(10);
    pdf.text(timeLabel, x + pillW + gap, y);
    var startX = x + pillW + gap + pdf.getTextWidth(timeLabel) + 3;
    var maxW = (x + cardW - PADDING) - startX;
    pdf.setTextColor(TEXT_MUTED.r,TEXT_MUTED.g,TEXT_MUTED.b); pdf.setFontSize(11);
    var lines = wrapLines(pdf, text, Math.max(30, maxW));
    var cy = y + 3;
    for(var i=0;i<lines.length;i++){ pdf.text(lines[i], startX, cy + i*LINE); }
    var usedH = Math.max(LINE, lines.length*LINE);
    if(makeTelLink && phone){
      var tel = String(phone).replace(/[^0-9+]/g,'');
      var label = 'Tel: '+phone;
      var y2 = cy + lines.length*LINE;
      pdf.setTextColor(0,0,0); pdf.setFontSize(10);
      pdf.text(label, startX, y2);
      try{ var w = pdf.getTextWidth(label); if(pdf.link){ pdf.link(startX, y2-4.2, w, 5.6, { url: 'tel:'+tel }); } }catch(e){}
      usedH += LINE;
    }
    return usedH + 1;
  }

  function presentSaveSheet(blob, fname){
    var url = URL.createObjectURL(blob);
    var host = document.getElementById('planner-actions');
    if(!host){
      host = document.createElement('div'); host.id='planner-actions';
      host.innerHTML = '<div class="sheet"><h4>Salva o condividi il PDF</h4><div class="row"><button id="actShare">Condividi…</button><button class="secondary" id="actOpen">Apri / Scarica</button></div><button class="close" id="actClose">Chiudi</button></div>';
      document.body.appendChild(host);
    }
    var btnShare = host.querySelector('#actShare');
    var btnOpen = host.querySelector('#actOpen');
    var btnClose = host.querySelector('#actClose');
    btnShare.onclick = function(){
      try{
        var file=null; try{ file=new File([blob], fname, {type:'application/pdf'}); }catch(e){}
        if(navigator.canShare && file && navigator.canShare({files:[file]})){
          navigator.share({ files:[file], title: fname, text: 'Itinerario' });
        }else if(navigator.share){
          navigator.share({ title: fname, url: url });
        }else{
          var a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener'; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); }, 1000);
        }
      }catch(e){
        var a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener'; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); }, 1000);
      }
    };
    btnOpen.onclick = function(){ var a=document.createElement('a'); a.href=url; a.download=fname; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); }, 1000); };
    btnClose.onclick = function(){ host.classList.remove('open'); setTimeout(function(){ URL.revokeObjectURL(url); }, 5000); };
    requestAnimationFrame(function(){ host.classList.add('open'); });
  }

  function toast(msg){
    var n=document.createElement('div'); n.id='planner-toast'; n.textContent=msg; document.body.appendChild(n);
    setTimeout(function(){ if(n && n.parentNode){ n.parentNode.removeChild(n); } }, 2200);
  }

  function generatePDF(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    try{
      var btn=document.getElementById('plannerGenerate'); if(btn){ btn.disabled=true; btn.setAttribute('aria-busy','true'); }
      injectCSS(); Progress.init(7); Progress.start('Preparazione…');

      var prefs=serializePrefs();
      var startISO=prefs.start, endISO=addDays(startISO, prefs.days-1);

      Promise.all([ ensurePDF(), loadJSON('assets/do.json'), loadJSON('assets/eat.json'), fetchWeather(startISO,endISO) ])
      .then(function(arr){
        Progress.step('Dati pronti…');
        var jsPDF=window.jspdf.jsPDF;
        var pdf=new jsPDF('p','mm','a4');
        var pw=pdf.internal.pageSize.getWidth();
        var ph=pdf.internal.pageSize.getHeight();
        var usableW = pw - 2*MARGIN;

        // Extract categories without Array.find
        function getItemsBySlug(cats, slug){
          for(var i=0;i<cats.length;i++){ if(cats[i] && cats[i].slug===slug){ return cats[i].items || []; } }
          return [];
        }
        var vedere=getItemsBySlug(arr[1].categories||[], 'vedere');
        var esc=getItemsBySlug(arr[1].categories||[], 'escursioni');
        var prov=getItemsBySlug(arr[1].categories||[], 'provare');
        var food=getItemsBySlug(arr[2].categories||[], 'tradizione'); if(!food.length){ var c0=(arr[2].categories||[])[0]; food=(c0&&c0.items)||[]; }
        var meteo=arr[3]||[];

        // Bg + header
        pdf.setFillColor(BRAND_BG.r,BRAND_BG.g,BRAND_BG.b); pdf.rect(0,0,pw,ph,'F');
        var y=12; pdf.setDrawColor(ACCENT.r,ACCENT.g,ACCENT.b); pdf.setLineWidth(0.8);
        pdf.line(MARGIN,12,pw-MARGIN,12);
        pdf.setTextColor(0,0,0);
        pdf.setFontSize(18); var safe=capFirst((prefs.name||'Ospite').trim()); pdf.text('Itinerario per '+safe, MARGIN, 20);
        pdf.setFontSize(11); pdf.text('Periodo: '+fmtDateCap(startISO)+' – '+fmtDateCap(endISO), MARGIN, 26);

        if(meteo.length){
          y=32; pdf.setFontSize(10); pdf.setTextColor(0,0,0);
          var cols = meteo.length<5? meteo.length:5; var colW=(usableW)/cols;
          for(var mi=0; mi<cols; mi++){
            var d=meteo[mi], x=MARGIN + mi*colW;
            var tmax=Math.round(d.tmax), tmin=Math.round(d.tmin), pr=(d.pprob==null?'—':String(d.pprob)+'%');
            pdf.text(tmax+'°/'+tmin+'° '+pr, x, y);
            pdf.text(fmtDateCap(d.date), x, y+5);
          }
          y+=14;
        }else{ y=34; }

        var used={};
        var cardW=usableW;
        for(var di=0; di<prefs.days; di++){
          var matt = pick(vedere.concat(prov), used);
          var lunch = pick(food, used);
          var pom = pick(esc.concat(vedere), used);
          var dinner = pick(food, used);

          var innerW = cardW - 2*PADDING;
          pdf.setFontSize(11);
          var estH = 14 + PADDING*2;
          function est(text, tel){ var lines = wrapLines(pdf, text, innerW-60).length; return LINE + lines*LINE + (tel?LINE:0) + 1; }
          estH += est((matt.name||'') + (matt.address? ' — '+matt.address : ''), false);
          estH += est((lunch.name||'') + (lunch.address? ' — '+lunch.address : ''), !!lunch.phone);
          estH += est((pom.name||'') + (pom.address? ' — '+pom.address : ''), false);
          estH += est((dinner.name||'') + (dinner.address? ' — '+dinner.address : ''), !!dinner.phone);

          if(y + estH > ph - 12){ pdf.addPage(); pdf.setFillColor(BRAND_BG.r,BRAND_BG.g,BRAND_BG.b); pdf.rect(0,0,pw,ph,'F'); y=12; }

          pdf.setDrawColor(220); pdf.setFillColor(CARD_BG.r,CARD_BG.g,CARD_BG.b);
          if(pdf.roundedRect){ pdf.roundedRect(MARGIN,y,cardW,estH,3,3,'FD'); } else { pdf.rect(MARGIN,y,cardW,estH,'FD'); }

          pdf.setDrawColor(ACCENT.r,ACCENT.g,ACCENT.b); pdf.setLineWidth(0.5); pdf.line(MARGIN+2, y+9, MARGIN+cardW-2, y+9);
          pdf.setTextColor(0,0,0); pdf.setFontSize(13);
          pdf.text((di+1)+'. '+fmtDateCap(addDays(startISO,di)), MARGIN+PADDING, y+6);

          var cx = MARGIN+PADDING, cy = y + 14;
          function lineFor(it){ return (it.name||'') + (it.address? ' — '+it.address : ''); }
          cy += renderSegment(pdf, cx, cy, cardW, 'Mattina', '09:00–12:30', lineFor(matt), null, false);
          cy += renderSegment(pdf, cx, cy, cardW, 'Pranzo', '12:30–14:30', lineFor(lunch), lunch.phone||null, true);
          cy += renderSegment(pdf, cx, cy, cardW, 'Pomeriggio', '15:00–19:00', lineFor(pom), null, false);
          cy += renderSegment(pdf, cx, cy, cardW, 'Sera', '19:30–22:30', lineFor(dinner), dinner.phone||null, true);

          y += estH + GAP;
          Progress.step('Giorno '+(di+1)+'/'+prefs.days+'…');
        }

        Progress.step('Pronto per salvare');
        var blob = pdf.output('blob');
        var fname='Itinerario_'+(prefs.name||'Ospite').replace(/[^a-z0-9-_]+/gi,'_')+'_'+startISO+'_'+prefs.days+'gg.pdf';
        presentSaveSheet(blob, fname);
        try{ pdf.save(fname); }catch(e){}
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
    injectCSS();
    var form=document.getElementById('plannerForm'); var btn=document.getElementById('plannerGenerate');
    if(btn){ btn.type='button'; btn.addEventListener('click', generatePDF, false); }
    if(form){ form.setAttribute('novalidate','novalidate'); form.addEventListener('submit', function(e){ e.preventDefault(); generatePDF(e); }, true); }
    document.addEventListener('click', function(e){ var t=e.target; if(!t) return; if((t.id==='plannerGenerate') || (t.closest && t.closest('#plannerGenerate'))){ e.preventDefault(); generatePDF(e);} }, true);
    var sd=document.getElementById('plannerStartDate'); if(sd && !sd.value){ sd.value=todayISO(); }
    // tiny banner to confirm JS attivo
    var b=document.createElement('div'); b.id='planner-toast'; b.textContent='Planner v15 attivo'; document.body.appendChild(b); setTimeout(function(){ if(b&&b.parentNode){ b.parentNode.removeChild(b);} }, 1800);
    window.PlannerDebug={version:'v15'};
  }

  function boot(){ try{ attach(); }catch(e){ console.error(e); } }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', boot, false); } else { boot(); }
})();
