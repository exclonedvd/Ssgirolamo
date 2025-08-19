
/*! Equalize card heights around the Meteo section (safe, no framework deps) */
(function(){
  function closestCard(el){
    while(el && el !== document.body){
      if(el.classList && el.classList.contains('card')) return el;
      el = el.parentElement;
    }
    return null;
  }
  function groupAndEqualize(){
    var meteo = document.querySelector('#meteo');
    if(!meteo) return;
    var myCard = closestCard(meteo) || meteo;
    var row = myCard.parentElement;
    if(!row) return;
    // pick siblings that look like cards in the same row/container
    var cards = Array.prototype.filter.call(row.children, function(n){
      if(n===myCard) return true;
      if(n.classList && n.classList.contains('card')) return true;
      if(n.querySelector && (n.querySelector('.card'))) return true;
      // sections with obvious content and border
      var cs = window.getComputedStyle(n);
      return (parseFloat(cs.borderTopWidth)||parseFloat(cs.borderRightWidth)||parseFloat(cs.borderBottomWidth)||parseFloat(cs.borderLeftWidth))>0;
    }).map(function(n){
      return n.querySelector('.card') || n;
    });
    if(cards.length<2) return;
    // reset heights
    cards.forEach(function(c){ c.style.minHeight = ''; });
    // compute max height
    var maxH = 0;
    cards.forEach(function(c){ maxH = Math.max(maxH, c.getBoundingClientRect().height); });
    // apply
    cards.forEach(function(c){ c.style.minHeight = Math.ceil(maxH) + 'px'; });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', groupAndEqualize);
  }else{ groupAndEqualize(); }
  window.addEventListener('resize', function(){ groupAndEqualize(); });
})();
