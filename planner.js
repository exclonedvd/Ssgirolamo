/* Planner ultra-safe (mobile-friendly, no html2canvas) */
(function(){
  var ITZ = 'Europe/Rome';
  var BRAND_BG_HEX = '#f6efe9';
  var ACCENT_HEX = '#2b5a44';

  function capFirst(s){ var t=(s==null?'':String(s)); return t ? t.charAt(0).toLocaleUpperCase('it-IT') + t.slice(1) : ''; }
  function todayISO(){ return new Date().toLocaleDateString('en-CA', {timeZone: ITZ}); }
  function addDays(iso, n){ var d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toLocaleDateString('en-CA',{timeZone:ITZ}); }
  function fmtDateCap(iso){
    try{
      var d = new Date(iso+'T00:00:00');
      return d.toLocaleDateString('it-IT', {weekday:'long', day:'2-digit', month:'long'})        .replace(/^./, c => c.toUpperCase());
    }catch(e){ return iso; }
  }

  function isIOS(){ var ua=navigator.userAgent||''; return /iPad|iPhone|iPod/.test(ua) || (/Mac/i.test(ua)&&('ontouchend' in document)); }
  function isAndroid(){ return /Android/i.test(navigator.userAgent||''); }

  function injectCSS(){
    if(document.getElementById('planner-ultrasafe-css')) return;
    var s=document.createElement('style'); s.id='planner-ultrasafe-css';
    s.textContent = [
      "#planner-progress{position:fixed;left:0;top:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.28);backdrop-filter:saturate(100%) blur(2px);z-index:99999}",
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

  var PlannerProgress = {
    _ui:null,_cur:0,_tot:1,
    _ensure(){ injectCSS(); if(this._ui) return this._ui; var w=document.createElement('div'); w.id='planner-progress'; w.innerHTML='<div class="box"><div class="head"><div class="spinner"></div><div class="label">Preparazione…</div></div><div class="bar"><i></i></div></div>'; document.body.appendChild(w); this._ui={wrap:w,bar:w.querySelector('.bar i'),label:w.querySelector('.label')}; return this._ui; },
    init(total){ this._ensure(); this._tot=Math.max(1,total||1); this._cur=0; this._render('Preparazione…',0); },
    _render(label, n){ var ui=this._ensure(); var pct=Math.round(100*(n/Math.max(1,this._tot))); ui.bar.style.width=pct+'%'; if(label) ui.label.textContent=label; },
    start(label){ this._ensure().wrap.classList.add('open'); this._cur=0; this._render(label||'Avvio…',0); },
    step(label){ this._cur++; this._render(label,this._cur); },
    finish(){ var ui=this._ensure(); this._render('Fatto', this._tot); setTimeout(function(){ ui.wrap.classList.remove('open'); }, 400); },
    error(label){ var ui=this._ensure(); ui.label.textContent=label||'Errore'; ui.bar.style.width='0%'; ui.wrap.classList.add('open'); }
  };

  function ensurePDFLibs(){
    if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    return loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')
      .catch(function(){ return loadScript('assets/vendor/jspdf.umd.min.js'); });
  }
  function loadScript(src){
    return new Promise(function(resolve,reject){
      var s=document.createElement('script'); s.src=src; s.async=true; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
    });
  }

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
      PlannerProgress.init(3); PlannerProgress.start('Preparazione…');

      var prefs=serializePrefs();
      var startISO=prefs.start, endISO=addDays(startISO, prefs.days-1);

      ensurePDFLibs().then(function(){
        PlannerProgress.step('Creo PDF…');
        var jsPDF=window.jspdf.jsPDF;
        var pdf=new jsPDF('p','mm','a4');
        var pw=pdf.internal.pageSize.getWidth();
        var ph=pdf.internal.pageSize.getHeight();

        // Sfondo brand
        pdf.setFillColor(246,239,233); pdf.rect(0,0,pw,ph,'F');
        // Header vettoriale
        pdf.setDrawColor(43,90,68); pdf.setLineWidth(0.8); pdf.line(8,14,pw-8,14);
        pdf.setFontSize(18); var safe=capFirst((prefs.name||'Ospite').trim()); pdf.text('Itinerario per '+safe, 8, 22);
        pdf.setFontSize(11); pdf.text('Periodo: '+fmtDateCap(startISO)+' – '+fmtDateCap(endISO), 8, 28);

        // Giorni (minimali, senza html2canvas)
        var y=38; pdf.setFontSize(12);
        for(var i=0;i<prefs.days;i++){
          var dISO=addDays(startISO,i);
          var title=fmtDateCap(dISO);
          if(y>ph-20){ pdf.addPage(); pdf.setFillColor(246,239,233); pdf.rect(0,0,pw,ph,'F'); y=20; }
          pdf.setTextColor(0,0,0); pdf.text((i+1)+'. '+title, 8, y); y+=7;
          pdf.setTextColor(100); pdf.text('Mattina / Pomeriggio / Sera — in base agli interessi selezionati.', 8, y); y+=10;
          PlannerProgress.step('Giorno '+(i+1)+'/'+prefs.days+'…');
        }

        PlannerProgress.step('Salvataggio…');
        var fname='Itinerario_'+(prefs.name||'Ospite').replace(/[^a-z0-9-_]+/gi,'_')+'_'+startISO+'_'+prefs.days+'gg.pdf';
        pdf.save(fname);
        PlannerProgress.finish();
      }).catch(function(err){
        console.error(err); PlannerProgress.error('Errore'); alert('Errore PDF: '+(err && err.message?err.message:err));
      }).finally(function(){ if(btn){ btn.disabled=false; btn.removeAttribute('aria-busy'); } });
    }catch(err){
      console.error(err); PlannerProgress.error('Errore'); alert('Errore PDF: '+(err && err.message?err.message:err));
      var btn=document.getElementById('plannerGenerate'); if(btn){ btn.disabled=false; btn.removeAttribute('aria-busy'); }
    }
  }

  function attachHandlers(){
    var form=document.getElementById('plannerForm');
    var btn=document.getElementById('plannerGenerate');
    if(btn){ btn.setAttribute('type','button'); btn.addEventListener('click', generatePDF); }
    if(form){ form.setAttribute('novalidate','novalidate'); form.addEventListener('submit', function(e){ e.preventDefault(); generatePDF(e); }, true); }
    // Listener di riserva in capture
    document.addEventListener('click', function(e){
      var t=e.target; if(!t) return;
      if(t.id==='plannerGenerate' || (t.closest && t.closest('#plannerGenerate'))){ e.preventDefault(); generatePDF(e); }
    }, true);

    // Banner di conferma script caricato (solo 2s)
    var note=document.createElement('div'); note.textContent='Planner mobile pronto'; note.style='position:fixed;right:8px;bottom:8px;background:#2b5a44;color:#fff;padding:6px 10px;border-radius:10px;z-index:99999;font:600 12px system-ui'; document.body.appendChild(note); setTimeout(function(){ note.remove(); }, 2000);

    var sd=document.getElementById('plannerStartDate'); if(sd && !sd.value){ sd.value=todayISO(); }
  }

  function boot(){ try{ injectCSS(); attachHandlers(); }catch(e){ console.error(e); } }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
