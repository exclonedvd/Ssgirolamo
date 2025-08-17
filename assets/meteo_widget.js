/*! Meteo — 7gg, riga scrollabile, data sopra (dd/mm), icona+temp sotto, freccia animata di scroll */
(function(){
  function ready(fn){ if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",fn);} else {fn();} }
  function findMyScript(){
    var s = document.currentScript; if(s) return s;
    var list=document.getElementsByTagName('script');
    return list[list.length-1] || null;
  }
  function ensureStyles(){
    if(document.getElementById('wx-meteo-css')) return;
    var css = document.createElement('style');
    css.id = 'wx-meteo-css';
    css.textContent = [
      '.wx-scroll-fade{position:absolute;right:0;top:3.25rem;width:24px;height:calc(100% - 3.25rem);',
      'background:linear-gradient(to left, rgba(255,255,255,.95), rgba(255,255,255,0));pointer-events:none;}',
      '.wx-scroll-hint{position:absolute;right:.5rem;bottom:.5rem;pointer-events:none;opacity:.8;}',
      '.wx-scroll-hint .arrow{display:inline-block;font-size:1rem;animation:wx-slide 1.2s ease-in-out infinite;}',
      '@keyframes wx-slide{0%{transform:translateX(0);opacity:.4;}50%{transform:translateX(6px);opacity:1;}100%{transform:translateX(0);opacity:.4;}}'
    ].join('');
    document.head.appendChild(css);
  }
  function iconNameFor(code){
    if(code===0) return 'sun';
    if(code===1||code===2) return 'partly';
    if(code===3) return 'cloud';
    if(code===45||code===48) return 'fog';
    if((code>=51&&code<=57)) return 'drizzle';
    if((code>=61&&code<=67)) return 'rain';
    if((code>=71&&code<=77)) return 'snow';
    if((code>=80&&code<=82)) return 'showers';
    if(code===85||code===86) return 'snow';
    if(code===95) return 'storm';
    if(code===96||code===99) return 'hail';
    return 'cloud';
  }
  function iconSvg(name, size){
    var w = parseInt(size,10); if(!(w>0)) w = 16;
    var wh = ' width="'+w+'" height="'+w+'"';
    var c = { sun:'#FFC107', cloud:'#90A4AE', fog:'#B0BEC5', drop:'#42A5F5', snow:'#90CAF9', storm:'#FDD835', hail:'#90CAF9' };
    var icons = {
      title: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><g><circle cx="7" cy="9" r="3" fill="'+c.sun+'"/><path d="M9 18h10a4 4 0 0 0 0-8 6 6 0 0 0-6 4.5A4 4 0 0 0 9 18Z" fill="'+c.cloud+'"/></g></svg>',
      sun: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><circle cx="12" cy="12" r="5" fill="'+c.sun+'"/><g stroke="'+c.sun+'" stroke-width="2" fill="none"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></g></svg>',
      cloud: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 18Z" fill="'+c.cloud+'"/></svg>',
      partly: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><g><circle cx="8" cy="10" r="3" fill="'+c.sun+'"/><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-6 4.5A4 4 0 0 0 7 18Z" fill="'+c.cloud+'"/></g></svg>',
      drizzle: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 15h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 15Z" fill="'+c.cloud+'"/><g stroke="'+c.drop+'" stroke-width="1.6"><line x1="9" y1="17" x2="7.5" y2="20"/><line x1="13" y1="17" x2="11.5" y2="20"/><line x1="17" y1="17" x2="15.5" y2="20"/></g></svg>',
      rain: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="'+c.cloud+'"/><g stroke="'+c.drop+'" stroke-width="2"><line x1="9" y1="16" x2="9" y2="21"/><line x1="13" y1="16" x2="13" y2="21"/><line x1="17" y1="16" x2="17" y2="21"/></g></svg>',
      showers: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="'+c.cloud+'"/><g stroke="'+c.drop+'" stroke-width="2"><path d="M9 16l-2 2m6-2l-2 2m6-2l-2 2" fill="none"/></g></svg>',
      snow: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="'+c.cloud+'"/><g fill="'+c.snow+'"><circle cx="9" cy="18" r="1"/><circle cx="13" cy="18" r="1"/><circle cx="17" cy="18" r="1"/></g></svg>',
      fog: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><g stroke="'+c.fog+'" stroke-width="2"><line x1="3" y1="9" x2="21" y2="9"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="3" y1="15" x2="21" y2="15"/></g></svg>',
      storm: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="'+c.cloud+'"/><polygon points="12,15 9,22 15,17 12,24" fill="'+c.storm+'"/></svg>',
      hail: '<svg viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="'+c.cloud+'"/><g fill="'+c.hail+'"><circle cx="9" cy="18" r="1.2"/><circle cx="13" cy="18" r="1.2"/><circle cx="17" cy="18" r="1.2"/></g></svg>'
    };
    return icons[name] || icons.cloud;
  }
  function fmtDM(iso){
    try{
      var d=new Date(iso+'T00:00:00');
      var dd=('0'+d.getDate()).slice(-2);
      var mm=('0'+(d.getMonth()+1)).slice(-2);
      return dd+'/'+mm;
    }catch(e){ return iso; }
  }
  function render(){
    try{
      var s=findMyScript(); if(!s) return;
      var targetSel=s.getAttribute('data-target')||'#meteo';
      var target=document.querySelector(targetSel); if(!target) return;
      var lat=s.getAttribute('data-lat'), lon=s.getAttribute('data-lon'); if(!lat||!lon){ target.innerHTML='<div class="container"><div class="card">Meteo non configurato</div></div>'; return; }
      var city=s.getAttribute('data-city')||'';
      var days=parseInt(s.getAttribute('data-days')||'7',10); if(!(days>0)) days=7;
      var mode=(s.getAttribute('data-mode')||'range').toLowerCase();
      var iconSize=s.getAttribute('data-icon')||'16';
      var titleIconSize=s.getAttribute('data-title-icon')||'14';
      var hint=(s.getAttribute('data-hint')||'true').toLowerCase()==='true';

      ensureStyles();

      // Placeholder
      target.innerHTML = '<div class="container"><div class="card"><h3 class="title"><span class="title-icon" aria-hidden="true">'
        + iconSvg('title', titleIconSize) + '</span> Meteo '+(city||'')+'</h3>'
        + '<div class="chips" role="list" style="display:flex;gap:.5rem;flex-wrap:nowrap;overflow-x:auto;"><div class="chip">caricamento…</div></div></div></div>';

      var url = 'https://api.open-meteo.com/v1/forecast'
        + '?latitude='+encodeURIComponent(lat)
        + '&longitude='+encodeURIComponent(lon)
        + '&daily=weathercode,temperature_2m_max,temperature_2m_min'
        + '&forecast_days='+encodeURIComponent(days)
        + '&timezone=auto';

      fetch(url,{cache:'no-store'})
        .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
        .then(function(data){
          if(!data || !data.daily || !data.daily.time){ throw new Error('No daily data'); }
          var d=data.daily;
          var len=Math.min(days,d.time.length);

          var html='';
          html+='<div class="container"><div class="card" style="position:relative;">';
          html+='<h3 class="title"><span class="title-icon" aria-hidden="true">'
              + iconSvg('title', titleIconSize)
              + '</span> Meteo '+(city?city:'')+'</h3>';
          // wrapper riga con scroll + hint
          html+='<div class="chips" role="list" style="display:flex;gap:.5rem;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;">';
          for(var i=0;i<len;i++){
            var code=d.weathercode[i];
            var tmin=Math.round(d.temperature_2m_min[i]);
            var tmax=Math.round(d.temperature_2m_max[i]);
            var tempTxt = (mode==='max') ? (tmax+'°') : (mode==='min') ? (tmin+'°') : (tmin+'°/'+tmax+'°');
            html+='<div class="chip" role="listitem" style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:.25rem;scroll-snap-align:start;">'
                +  '<div class="chip-line"><strong>'+fmtDM(d.time[i])+'</strong></div>'
                +  '<div class="chip-line" style="display:flex;align-items:center;gap:.35rem;">'
                +    '<span class="chip-icon" aria-hidden="true">'+iconSvg(iconNameFor(code), iconSize)+'</span>'
                +    '<span class="chip-temp">'+tempTxt+'</span>'
                +  '</div>'
                +'</div>';
          }
          html+='</div>'; // chips
          if(hint){
            html+='<div class="wx-scroll-fade" aria-hidden="true"></div>';
            html+='<div class="wx-scroll-hint" aria-hidden="true"><span class="arrow">→</span></div>';
          }
          html+='</div></div>'; // card/container
          target.innerHTML=html;
        })
        .catch(function(err){
          target.innerHTML = '<div class="container"><div class="card"><h3 class="title">Meteo '+(city||'')+'</h3><div class="chip">Errore meteo ('+(err&&err.message?err.message:'errore')+')</div></div></div>';
        });
    }catch(e){ console.warn('[meteo_widget] errore generale', e); }
  }
  ready(render);
})();