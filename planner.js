/* Planner ES5 v21:
   - Logo agriturismo SOLO in prima pagina
   - "Itinerario di <Nome>" e "Periodo" SOLO in prima pagina
   - riga vuota tra periodo e meteo
   - footer con numero pagina + data generazione
   - attività extra dell'agriturismo (verde, massaggi, apicoltore)
   - table layout con pill centrati (da v18)
*/
(function(){
  var ITZ='Europe/Rome';
  var BRAND_BG={r:246,g:239,b:233};
  var ACCENT={r:43,g:90,b:68};
  var CARD_BG={r:255,g:255,b:255};
  var TEXT_MUTED={r:60,g:60,b:60};
  var GRID={r:220,g:220,b:220};
  var MARGIN=8, GAP=6, PADDING=6, LINE=5.8;

  function capFirst(s){ var t=(s==null?'':String(s)); return t ? t.charAt(0).toLocaleUpperCase('it-IT') + t.slice(1) : ''; }
  function todayISO(){ return new Date().toLocaleDateString('en-CA',{timeZone:ITZ}); }
  function addDays(iso,n){ var d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toLocaleDateString('en-CA',{timeZone:ITZ}); }
  function fmtDateCap(iso){ try{var d=new Date(iso+'T00:00:00'); var s=d.toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long'}); return s.replace(/^./, function(c){return c.toUpperCase();}); }catch(e){return iso;} }
  function genDateStr(){ try{ return new Date().toLocaleString('it-IT',{timeZone:ITZ,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){ var d=new Date(); return d.toISOString().slice(0,16).replace('T',' ');} }

  function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function ensurePDF(){ if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve(); return loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js').catch(function(){ return loadScript('assets/vendor/jspdf.umd.min.js'); }); }

  function injectCSS(){
    if(document.getElementById('planner-css-v21')) return;
    var s=document.createElement('style'); s.id='planner-css-v21';
    s.textContent="#planner-progress{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.28);backdrop-filter:blur(2px);z-index:99999}#planner-progress.open{display:flex}#planner-progress .box{min-width:260px;max-width:90vw;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.2);padding:14px 16px}#planner-progress .head{display:flex;align-items:center;gap:8px;margin-bottom:10px}#planner-progress .head .spinner{width:16px;height:16px;border:2px solid #2b5a44;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite}#planner-progress .head .label{font-weight:600}#planner-progress .bar{background:#eee;height:8px;border-radius:999px;overflow:hidden}#planner-progress .bar i{display:block;height:100%;width:0;background:#2b5a44}@keyframes spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(s);
  }

  var Progress={ _ui:null,_cur:0,_tot:1,
    _ensure:function(){ injectCSS(); if(this._ui) return this._ui; var w=document.createElement('div'); w.id='planner-progress'; w.innerHTML='<div class=\"box\"><div class=\"head\"><div class=\"spinner\"></div><div class=\"label\">Preparazione…</div></div><div class=\"bar\"><i></i></div></div>'; document.body.appendChild(w); this._ui={wrap:w,bar:w.querySelector('.bar i'),label:w.querySelector('.label')}; return this._ui; },
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

  // Weather icons (vector)
  function iconType(wcode){ if(wcode==null) return 'na'; if(wcode===0 || wcode===1) return 'sun'; if(wcode===2 || wcode===3) return 'partly'; if(wcode===61 || wcode===63 || wcode===65 || wcode===80 || wcode===81 || wcode===82 || wcode===51 || wcode===53 || wcode===55) return 'rain'; return 'cloud'; }
  function drawSun(pdf,x,y){ pdf.setFillColor(255,191,0); pdf.circle(x,y,3,'F'); pdf.setDrawColor(255,191,0); pdf.setLineWidth(0.6); for(var a=0;a<8;a++){ var ang=a*Math.PI/4; pdf.line(x+4*Math.cos(ang), y+4*Math.sin(ang), x+6.2*Math.cos(ang), y+6.2*Math.sin(ang)); } }
  function drawCloud(pdf,x,y){ pdf.setFillColor(200,200,200); pdf.circle(x-2,y,2.2,'F'); pdf.circle(x+0.8,y-1.2,2.8,'F'); pdf.circle(x+3.6,y,2.2,'F'); pdf.rect(x-4.6,y,9.2,3,'F'); }
  function drawRain(pdf,x,y){ drawCloud(pdf,x,y); pdf.setDrawColor(60,130,200); pdf.setLineWidth(0.7); pdf.line(x-2.5,y+3.8,x-3.2,y+5.8); pdf.line(x,y+3.8,x-0.7,y+5.8); pdf.line(x+2.5,y+3.8,x+1.8,y+5.8); }
  function drawPartly(pdf,x,y){ drawCloud(pdf,x+1,y); drawSun(pdf,x-3.8,y-1.2); }
  function drawIcon(pdf,type,x,y){ if(type==='sun') drawSun(pdf,x,y); else if(type==='partly') drawPartly(pdf,x,y); else if(type==='rain') drawRain(pdf,x,y); else drawCloud(pdf,x,y); }

  function getLogoDataUrl(){ return new Promise(function(resolve){ var img=new Image(); img.crossOrigin='anonymous'; img.onload=function(){ try{ var c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight; var ctx=c.getContext('2d'); ctx.drawImage(img,0,0); resolve(c.toDataURL('image/jpeg',0.9)); }catch(e){ resolve(null); } }; img.onerror=function(){ resolve(null); }; img.src='assets/logo.jpg'; }); }

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
    var inputs=form.querySelectorAll('input[name=\"interests\"]:checked');
    var ints=[]; for(var i=0;i<inputs.length;i++){ ints.push(inputs[i].value); }
    var sd=document.getElementById('plannerStartDate');
    var start=(sd && sd.value) || todayISO();
    if(!ints.length) ints=['arte','natura','enogastronomia'];
    return {name:name,days:days,interests:ints,start:start};
  }

  function textChunksNoSpaces(s, max){ var arr=[]; if(!s) return arr; for(var i=0;i<s.length;i+=max){ arr.push(s.substr(i, max)); } return arr; }
  function wrapLines(pdf, text, maxWidth){
    pdf.setLineHeightFactor(1.15);
    text = String(text||'');
    try{
      var out = pdf.splitTextToSize(text, maxWidth);
      for(var i=0;i<out.length;i++){
        if(pdf.getTextWidth(out[i])>maxWidth+0.5 && out[i].indexOf(' ')<0){
          var chunks = textChunksNoSpaces(out[i], 22);
          Array.prototype.splice.apply(out,[i,1].concat(chunks));
          i += chunks.length-1;
        }
      }
      return out;
    }catch(e){
      var words = text.replace(/([/\\,-])/g,' $1 ').split(/\s+/);
      var out2=[], cur='';
      for(var j=0;j<words.length;j++){
        var t=words[j], tmp=cur? (cur+' '+t):t;
        try{ if(pdf.getTextWidth(tmp)>maxWidth && cur){ out2.push(cur); cur=t; } else { cur=tmp; } }catch(_){ cur=tmp; }
      }
      if(cur) out2.push(cur);
      return out2;
    }
  }

  function renderRowsTable(pdf, x, y, cardW, rows){
    pdf.setFontSize(10);
    var i;
    var pills=['Mattina','Pranzo','Pomeriggio','Sera'];
    var maxPillW=0, padX=3, padY=2, fs=10;
    for(i=0;i<pills.length;i++){ maxPillW = Math.max(maxPillW, pdf.getTextWidth(pills[i]) + padX*2 + 2); }
    var times=['09:00–12:30','12:30–14:30','15:00–19:00','19:30–22:30'];
    var maxTimeW=0; for(i=0;i<times.length;i++){ maxTimeW = Math.max(maxTimeW, pdf.getTextWidth(times[i])); }
    var colPill = Math.min(36, Math.max(24, maxPillW + 6));
    var colTime = Math.min(32, Math.max(22, maxTimeW + 8));
    var gap1=4, gap2=4;
    var textMaxW = Math.max(40, cardW - (colPill + gap1 + colTime + gap2) - 6);
    var gridX1 = x + colPill + gap1;
    var gridX2 = gridX1 + colTime + gap2;

    var sizes=[], total=0;
    pdf.setFontSize(11);
    for(i=0;i<rows.length;i++){
      var r=rows[i];
      var lines = wrapLines(pdf, r.text, textMaxW);
      var contentH = Math.max(LINE, lines.length*LINE) + (r.tel?LINE:0);
      var pillH = fs*0.45 + padY*2;
      var rowH = Math.max(contentH, pillH) + 6;
      sizes.push({lines:lines, h:rowH, contentH:contentH});
      total += rowH;
    }

    var cy = y;
    pdf.setDrawColor(GRID.r,GRID.g,GRID.b); pdf.setLineWidth(0.2);
    for(i=0;i<rows.length;i++){
      var rr = rows[i], s = sizes[i], rowTop = cy, rowH = s.h;
      pdf.line(gridX1, rowTop+1, gridX1, rowTop+rowH-1);
      pdf.line(gridX2, rowTop+1, gridX2, rowTop+rowH-1);

      var centerY = rowTop + rowH/2;
      var pillH = fs*0.45 + padY*2;
      var pillW = Math.min(colPill-6, pdf.getTextWidth(rr.pill) + padX*2 + 2);
      var top = centerY - pillH/2;
      var baseline = top + padY + fs*0.45;

      pdf.setFillColor(ACCENT.r,ACCENT.g,ACCENT.b);
      if(pdf.roundedRect){ pdf.roundedRect(x + (colPill - pillW)/2, top, pillW, pillH, 3, 3, 'F'); } else { pdf.rect(x + (colPill - pillW)/2, top, pillW, pillH, 'F'); }
      pdf.setTextColor(255); pdf.setFontSize(fs);
      pdf.text(rr.pill, x + (colPill - pdf.getTextWidth(rr.pill))/2, baseline);

      pdf.setTextColor(0,0,0); pdf.setFontSize(10);
      var timeX = gridX1 + (colTime - pdf.getTextWidth(rr.time))/2;
      pdf.text(rr.time, timeX, baseline);

      pdf.setTextColor(TEXT_MUTED.r,TEXT_MUTED.g,TEXT_MUTED.b); pdf.setFontSize(11);
      var tx = gridX2 + 2;
      var contentY = rowTop + Math.max(4, (rowH - s.contentH)/2);
      var j;
      for(j=0;j<s.lines.length;j++){ pdf.text(s.lines[j], tx, contentY + j*LINE); }
      if(rr.tel){
        var y2 = contentY + s.lines.length*LINE + 1.5;
        pdf.setTextColor(0,0,0); pdf.setFontSize(10);
        var label='Tel: '+rr.tel; pdf.text(label, tx, y2 + 3.0);
        try{ var w=pdf.getTextWidth(label); if(pdf.link){ pdf.link(tx, y2-1, w, 6, { url:'tel:'+String(rr.tel).replace(/[^0-9+]/g,'') }); } }catch(e){}
      }

      cy += rowH;
    }

    pdf.setDrawColor(GRID.r,GRID.g,GRID.b); pdf.rect(x+0.5, y, cardW-1, total);
    return total;
  }

  function generatePDF(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    try{
      var btn=document.getElementById('plannerGenerate'); if(btn){ btn.disabled=true; btn.setAttribute('aria-busy','true'); }
      injectCSS(); Progress.init(7); Progress.start('Preparazione…');

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

        function itemsBySlug(cats, slug){ for(var i=0;i<cats.length;i++){ if(cats[i] && cats[i].slug===slug){ return cats[i].items || []; } } return []; }
        var vedere=itemsBySlug(arr[1].categories||[], 'vedere');
        var esc=itemsBySlug(arr[1].categories||[], 'escursioni');
        var prov=itemsBySlug(arr[1].categories||[], 'provare');
        var food=itemsBySlug(arr[2].categories||[], 'tradizione'); if(!food.length){ var c0=(arr[2].categories||[])[0]; food=(c0&&c0.items)||[]; }
        var meteo=arr[3]||[];
        var logo=arr[4];

        // --- Agriturismo extras ---
        var extras=[
          {name:'Tempo nel verde', address:'Corte San Girolamo — relax tra i giardini e il parco'},
          {name:'Massaggi', address:'Corte San Girolamo — su richiesta'},
          {name:'Nei panni di un apicoltore', address:'Corte San Girolamo — laboratorio apistico'}
        ];
        vedere = (vedere||[]).concat(extras);
        prov   = (prov||[]).concat(extras);
        esc    = (esc||[]).concat(extras);

        // Header (SOLO prima pagina)
        pdf.setFillColor(BRAND_BG.r,BRAND_BG.g,BRAND_BG.b); pdf.rect(0,0,pw,ph,'F');
        pdf.setDrawColor(ACCENT.r,ACCENT.g,ACCENT.b); pdf.setLineWidth(0.8);
        pdf.line(MARGIN,12,pw-MARGIN,12);
        var safe=capFirst((prefs.name||'Ospite').trim());
        pdf.setTextColor(0,0,0);
        pdf.setFontSize(18); pdf.text('Itinerario di '+safe, MARGIN, 20);
        if(logo){ try{ var LOGO_SIZE=34; pdf.addImage(logo,'JPEG', pw-(MARGIN+LOGO_SIZE), 6, LOGO_SIZE, LOGO_SIZE); }catch(e){} }
        pdf.setFontSize(11); pdf.text('Periodo: '+fmtDateCap(startISO)+' – '+fmtDateCap(endISO), MARGIN, 28);
        var y = 34 + 6; // riga vuota extra prima del meteo

        // Meteo strip (solo prima pagina)
        if(meteo.length){
          pdf.setFontSize(10); pdf.setTextColor(0,0,0);
          var cols = meteo.length<5? meteo.length:5; var colW=(usableW)/cols;
          for(var mi=0; mi<cols; mi++){
            var d=meteo[mi], x=MARGIN + mi*colW;
            drawIcon(pdf, iconType(d.wcode), x+5, y-1);
            var tmax=Math.round(d.tmax), tmin=Math.round(d.tmin), pr=(d.pprob==null?'—':String(d.pprob)+'%');
            pdf.text(tmax+'°/'+tmin+'°', x+12, y);
            pdf.text(pr, x+12, y+5);
            pdf.text(fmtDateCap(d.date), x, y+10);
          }
          y+=18;
        }

        var used={};
        var cardW=usableW;
        for(var di=0; di<prefs.days; di++){
          var matt = pick(vedere.concat(prov), used);
          var lunch = pick(food, used);
          var pom = pick(esc.concat(vedere), used);
          var dinner = pick(food, used);
          function lineFor(it){ return (it.name||'') + (it.address? ' — '+it.address : ''); }

          var rows=[
            {pill:'Mattina', time:'09:00–12:30', text:lineFor(matt)},
            {pill:'Pranzo', time:'12:30–14:30', text:lineFor(lunch), tel:lunch.phone||null},
            {pill:'Pomeriggio', time:'15:00–19:00', text:lineFor(pom)},
            {pill:'Sera', time:'19:30–22:30', text:lineFor(dinner), tel:dinner.phone||null}
          ];

          // Stima altezza card per salto pagina (coerente con layout tabella)
          var padX=3, padY=2, fs=10;
          var pills=['Mattina','Pranzo','Pomeriggio','Sera']; var maxPillW=0, i;
          for(i=0;i<pills.length;i++){ maxPillW = Math.max(maxPillW, pdf.getTextWidth(pills[i]) + padX*2 + 2); }
          var times=['09:00–12:30','12:30–14:30','15:00–19:00','19:30–22:30']; var maxTimeW=0;
          for(i=0;i<times.length;i++){ maxTimeW = Math.max(maxTimeW, pdf.getTextWidth(times[i])); }
          var colPill = Math.min(36, Math.max(24, maxPillW + 6));
          var colTime = Math.min(32, Math.max(22, maxTimeW + 8));
          var gap1=4, gap2=4;
          var textMaxW = Math.max(40, (cardW - (colPill + gap1 + colTime + gap2) - 6));
          var totalH=0;
          pdf.setFontSize(11);
          for(i=0;i<rows.length;i++){
            var ls = wrapLines(pdf, rows[i].text, textMaxW);
            var contentH = Math.max(LINE, ls.length*LINE) + (rows[i].tel?LINE:0);
            var pillH = fs*0.45 + padY*2;
            totalH += Math.max(contentH, pillH) + 6;
          }
          var cardH = 14 + PADDING*2 + totalH;

          if(y + cardH > ph - 14){
            // NUOVA PAGINA: niente logo, niente "Itinerario di", niente "Periodo", niente meteo
            pdf.addPage();
            pdf.setFillColor(BRAND_BG.r,BRAND_BG.g,BRAND_BG.b); pdf.rect(0,0,pw,ph,'F');
            pdf.setDrawColor(ACCENT.r,ACCENT.g,ACCENT.b); pdf.setLineWidth(0.8);
            pdf.line(MARGIN,12,pw-MARGIN,12);
            y = 20; // subito contenuti
          }

          // draw card
          pdf.setDrawColor(220); pdf.setFillColor(CARD_BG.r,CARD_BG.g,CARD_BG.b);
          if(pdf.roundedRect){ pdf.roundedRect(MARGIN,y,cardW,cardH,3,3,'FD'); } else { pdf.rect(MARGIN,y,cardW,cardH,'FD'); }
          pdf.setDrawColor(ACCENT.r,ACCENT.g,ACCENT.b); pdf.setLineWidth(0.5); pdf.line(MARGIN+2, y+9, MARGIN+cardW-2, y+9);
          pdf.setTextColor(0,0,0); pdf.setFontSize(13);
          pdf.text((di+1)+'. '+fmtDateCap(addDays(startISO,di)), MARGIN+PADDING, y+6);
          var wd = meteo[di] || {}; drawIcon(pdf, iconType(wd.wcode), MARGIN+cardW-8, y+6);

          var innerTop = y + 14;
          renderRowsTable(pdf, MARGIN+PADDING, innerTop, cardW - 2*PADDING, rows);

          y += cardH + GAP;
          Progress.step('Giorno '+(di+1)+'/'+prefs.days+'…');
        }

        // footer su ogni pagina
        var total = pdf.getNumberOfPages();
        var stamp = genDateStr();
        for(var p=1; p<=total; p++){
          pdf.setPage(p);
          pdf.setTextColor(100); pdf.setFontSize(9);
          var footer='Pagina '+p+' di '+total+'  ·  Generato il '+stamp;
          pdf.text(footer, MARGIN, ph-6);
        }

        Progress.step('Salvataggio…');
        var fname='Itinerario_'+(safe||'Ospite').replace(/[^a-z0-9-_]+/gi,'_')+'_'+startISO+'_'+prefs.days+'gg.pdf';
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
    injectCSS();
    var form=document.getElementById('plannerForm'); var btn=document.getElementById('plannerGenerate');
    if(btn){ btn.type='button'; btn.addEventListener('click', generatePDF, false); }
    if(form){ form.setAttribute('novalidate','novalidate'); form.addEventListener('submit', function(e){ e.preventDefault(); generatePDF(e); }, true); }
    document.addEventListener('click', function(e){ var t=e.target; if(!t) return; if((t.id==='plannerGenerate') || (t.closest && t.closest('#plannerGenerate'))){ e.preventDefault(); generatePDF(e);} }, true);
    var sd=document.getElementById('plannerStartDate'); if(sd && !sd.value){ sd.value=todayISO(); }
  }

  function boot(){ try{ attach(); }catch(e){ console.error(e); } }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', boot, false); } else { boot(); }
})();
