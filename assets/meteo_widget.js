/*! Meteo — Widget minimale (iOS/Safari friendly, no deps) */
(function(){
  function ready(fn){
    if(document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", fn); }
    else { fn(); }
  }
  function findMyScript(){
    // Prefer currentScript; fallback to last script with data-target or src including meteo_widget.js
    var s = document.currentScript;
    if(s) return s;
    var list = Array.prototype.slice.call(document.querySelectorAll('script'));
    for(var i=list.length-1;i>=0;i--){
      var el=list[i];
      var src = (el.getAttribute('src')||'').toLowerCase();
      if(el.hasAttribute('data-target') || src.indexOf('meteo_widget.js')>=0) return el;
    }
    return null;
  }
  function render(){
    try{
      var s = findMyScript(); if(!s) return;
      var targetSel = s.getAttribute('data-target') || '#meteo';
      var target = document.querySelector(targetSel);
      if(!target) return;
      var lat = s.getAttribute('data-lat'), lon = s.getAttribute('data-lon');
      var city = s.getAttribute('data-city') || '';
      if(!lat || !lon){ console.warn('[meteo_widget] manca lat/lon'); return; }

      var url = 'https://api.open-meteo.com/v1/forecast'
              + '?latitude='+encodeURIComponent(lat)
              + '&longitude='+encodeURIComponent(lon)
              + '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
              + '&timezone=auto';

      fetch(url, {cache:'no-store'})
        .then(function(r){ return r.json(); })
        .then(function(data){
          var d = data && data.daily || {};
          var n = Math.min(5, (d.time||[]).length);
          if(!n){ target.innerHTML=''; return; }

          function dayLabel(iso){
            try{
              var dd = new Date(iso+'T00:00:00');
              return dd.toLocaleDateString('it-IT',{weekday:'short', day:'2-digit'});
            }catch(e){ return iso; }
          }

          var html = '';
          html += '<div class="container"><div class="card">';
          html += '<h3 style="margin-top:0">Meteo '+(city?city:'')+'</h3>';
          html += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
          for(var i=0;i<n;i++){
            var tmin = Math.round(d.temperature_2m_min[i]);
            var tmax = Math.round(d.temperature_2m_max[i]);
            var p = (d.precipitation_probability_max[i] != null ? d.precipitation_probability_max[i] : 0);
            var label = dayLabel(d.time[i]);
            html += '<div class="chip" style="min-width:96px;padding:8px;border:1px solid rgba(0,0,0,.1);border-radius:8px">';
            html += '<strong>'+label+'</strong><br>';
            html += tmin+'° / '+tmax+'°<br>';
            html += '💧 '+p+'%';
            html += '</div>';
          }
          html += '</div></div></div>';
          target.innerHTML = html;
        })
        .catch(function(err){
          console.warn('[meteo_widget] fetch fallita', err);
        });
    }catch(e){ console.warn('[meteo_widget] errore', e); }
  }
  ready(render);
})();