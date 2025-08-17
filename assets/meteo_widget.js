/*! Meteo — Widget scheda (7 giorni) con icone piccole, stile UI del sito */
(function(){
  function ready(fn){ if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",fn);} else {fn();} }
  function findMyScript(){
    var s = document.currentScript; if(s) return s;
    var q = document.querySelectorAll('script'); for(var i=q.length-1;i>=0;i--){
      var el=q[i]; var src=(el.getAttribute('src')||'').toLowerCase();
      if(el.hasAttribute('data-target') || src.indexOf('meteo_widget.js')>=0) return el;
    }
    return null;
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
    var w = parseInt(size,10); if(!(w>0)) w = 20;
    var wh = ' width="'+w+'" height="'+w+'"';
    var icons = {
      sun: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></g></svg>',
      cloud: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 18Z" fill="currentColor"/></svg>',
      partly: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><g fill="currentColor"><circle cx="8" cy="10" r="3"/><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-6 4.5A4 4 0 0 0 7 18Z"/></g></svg>',
      drizzle: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 15h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 15Z" fill="currentColor"/><g stroke="currentColor" stroke-width="1.6"><line x1="9" y1="17" x2="7.5" y2="20"/><line x1="13" y1="17" x2="11.5" y2="20"/><line x1="17" y1="17" x2="15.5" y2="20"/></g></svg>',
      rain: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="currentColor"/><g stroke="currentColor" stroke-width="2"><line x1="9" y1="16" x2="9" y2="21"/><line x1="13" y1="16" x2="13" y2="21"/><line x1="17" y1="16" x2="17" y2="21"/></g></svg>',
      showers: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="currentColor"/><g stroke="currentColor" stroke-width="2"><path d="M9 16l-2 2m6-2l-2 2m6-2l-2 2" fill="none"/></g></svg>',
      snow: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="currentColor"/><g fill="currentColor"><circle cx="9" cy="18" r="1"/><circle cx="13" cy="18" r="1"/><circle cx="17" cy="18" r="1"/></g></svg>',
      fog: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><g stroke="currentColor" stroke-width="2"><line x1="3" y1="9" x2="21" y2="9"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="3" y1="15" x2="21" y2="15"/></g></svg>',
      storm: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="currentColor"/><polygon points="12,15 9,22 15,17 12,24" fill="currentColor"/></svg>',
      hail: '<svg class="icon sm" viewBox="0 0 24 24"'+wh+' aria-hidden="true"><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 7 14Z" fill="currentColor"/><g fill="currentColor"><circle cx="9" cy="18" r="1.2"/><circle cx="13" cy="18" r="1.2"/><circle cx="17" cy="18" r="1.2"/></g></svg>'
    };
    return icons[name] || icons.cloud;
  }
  function render(){
    try{
      var s=findMyScript(); if(!s) return;
      var targetSel=s.getAttribute('data-target')||'#meteo';
      var target=document.querySelector(targetSel); if(!target) return;
      var lat=s.getAttribute('data-lat'), lon=s.getAttribute('data-lon'); if(!lat||!lon) return;
      var city=s.getAttribute('data-city')||'';
      var days=parseInt(s.getAttribute('data-days')||'7',10); if(!(days>0)) days=7;
      var mode=(s.getAttribute('data-mode')||'range').toLowerCase(); // 'range' | 'max' | 'min'
      var iconSize=s.getAttribute('data-icon')||'20'; // px

      var url = 'https://api.open-meteo.com/v1/forecast'
        + '?latitude='+encodeURIComponent(lat)
        + '&longitude='+encodeURIComponent(lon)
        + '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
        + '&timezone=auto';

      fetch(url,{cache:'no-store'})
        .then(function(r){ return r.json(); })
        .then(function(data){
          var d=(data&&data.daily)||{};
          var len=Math.min(days,(d.time||[]).length);
          if(!len){ target.innerHTML=''; return; }

          function dayLabel(iso){
            try{ return new Date(iso+'T00:00:00').toLocaleDateString('it-IT',{weekday:'short',day:'2-digit'}); }
            catch(e){ return iso; }
          }

          var html='';
          html+='<div class="container"><div class="card">';
          html+='<h3 class="title">Meteo '+(city?city:'')+'</h3>';
          html+='<div class="chips" role="list">';
          for(var i=0;i<len;i++){
            var code=d.weathercode[i];
            var tmin=Math.round(d.temperature_2m_min[i]);
            var tmax=Math.round(d.temperature_2m_max[i]);
            var p=(d.precipitation_probability_max[i]!=null?d.precipitation_probability_max[i]:0);
            var tempTxt = (mode==='max') ? (tmax+'°')
                          : (mode==='min') ? (tmin+'°')
                          : (tmin+'° / '+tmax+'°');
            var icn=iconSvg(iconNameFor(code), iconSize);

            html+='<div class="chip" role="listitem">'
                +  '<div class="chip-line"><strong>'+dayLabel(d.time[i])+'</strong></div>'
                +  '<div class="chip-line"><span class="chip-icon" aria-hidden="true">'+icn+'</span> '
                +    '<span class="chip-temp">'+tempTxt+'</span></div>'
                +  '<div class="chip-line">💧 '+p+'%</div>'
                +'</div>';
          }
          html+='</div></div></div>';
          target.innerHTML=html;
        })
        .catch(function(err){ console.warn('[meteo_widget] fetch fallita',err); });
    }catch(e){ console.warn('[meteo_widget] errore',e); }
  }
  ready(render);
})();