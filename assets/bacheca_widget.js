
/*! Bacheca Ospiti — Widget free, zero dipendenze */
(function(){
  try{
    var script = document.currentScript || (function(){var s=document.querySelector('script[data-target]'); return s})();
    var targetSel = (script && script.getAttribute('data-target')) || '#bacheca';
    var titleText = (script && script.getAttribute('data-title'));
    var hideTitle = !titleText || script.hasAttribute('data-hide-title');
    titleText = titleText || 'Bacheca ospiti';
    var el = document.querySelector(targetSel);
    if(!el){ console.warn('Bacheca widget: target non trovato', targetSel); return; }

    var DATA = [
      { t:'Palazzo Ducale', k:'vedere', m:'https://www.google.com/maps?q=Palazzo+Ducale+Mantova' },
      { t:'Castello di San Giorgio', k:'vedere', m:'https://www.google.com/maps?q=Castello+di+San+Giorgio+Mantova' },
      { t:'Museo Archeologico Nazionale', k:'vedere', m:'https://www.google.com/maps?q=Museo+Archeologico+Nazionale+Mantova' },
      { t:'Duomo di Mantova', k:'vedere', m:'https://www.google.com/maps?q=Duomo+di+Mantova' },
      { t:'Casa di Rigoletto', k:'vedere', m:'https://www.google.com/maps?q=Casa+di+Rigoletto+Mantova' },
      { t:'Teatro Bibiena', k:'vedere', m:'https://www.google.com/maps?q=Teatro+Bibiena+Mantova' },
      { t:'Basilica di Sant’Andrea', k:'vedere', m:'https://www.google.com/maps?q=Basilica+di+Sant%27Andrea+Mantova' },
      { t:'Biblioteca Teresiana', k:'vedere', m:'https://www.google.com/maps?q=Biblioteca+Comunale+Teresiana+Mantova' },
      { t:'Museo dei Vigili del Fuoco', k:'vedere', m:'https://www.google.com/maps?q=Museo+nazionale+dei+Vigili+del+Fuoco+Mantova' },
      { t:'Rotonda di San Lorenzo', k:'vedere', m:'https://www.google.com/maps?q=Rotonda+di+San+Lorenzo+Mantova' },
      { t:'Piazza Leon Battista Alberti', k:'vedere', m:'https://www.google.com/maps?q=Piazza+Leon+Battista+Alberti+Mantova' },
      { t:'Piazza delle Erbe + Torre dell’Orologio', k:'vedere', m:'https://www.google.com/maps?q=Piazza+delle+Erbe+Torre+dell%27Orologio+Mantova' },
      { t:'Casa del Mercante', k:'vedere', m:'https://www.google.com/maps?q=Casa+del+Mercante+Mantova' },
      { t:'Palazzo d’Arco', k:'vedere', m:'https://www.google.com/maps?q=Palazzo+d%27Arco+Mantova' },
      { t:'Loggia delle Pescherie', k:'vedere', m:'https://www.google.com/maps?q=Loggia+delle+Pescherie+Mantova' },
      { t:'Teatro Sociale', k:'vedere', m:'https://www.google.com/maps?q=Teatro+Sociale+Mantova' },
      { t:'Casa di Giulio Romano', k:'vedere', m:'https://www.google.com/maps?q=Casa+di+Giulio+Romano+Mantova' },
      { t:'Casa del Mantegna', k:'vedere', m:'https://www.google.com/maps?q=Casa+del+Mantegna+Mantova' },
      { t:'Tempio & Palazzo di San Sebastiano', k:'vedere', m:'https://www.google.com/maps?q=San+Sebastiano+Mantova' },
      { t:'Palazzo Te', k:'vedere', m:'https://www.google.com/maps?q=Palazzo+Te+Mantova' },
      { t:'Chiesa di Santa Maria del Gradaro', k:'vedere', m:'https://www.google.com/maps?q=Santa+Maria+del+Gradaro+Mantova' },
      { t:'Pasticceria Antoniazzi', k:'provare', m:'https://www.google.com/maps?q=Pasticceria+Antoniazzi+Mantova' },
      { t:'Caffè Borsa', k:'provare', m:'https://www.google.com/maps?q=Caff%C3%A8+Borsa+Mantova' },
      { t:'Pande & Pane — pasta fresca & torta di rose', k:'provare', m:'https://www.google.com/maps?q=Pande+e+Pane+Mantova' },
      { t:'Papas (lungolago)', k:'provare', m:'https://www.google.com/maps?q=Papas+Mantova' },
      { t:'La Zanzara (lungolago)', k:'provare', m:'https://www.google.com/maps?q=La+Zanzara+Mantova' },
      { t:'Caffè Cubano — cocktail', k:'provare', m:'https://www.google.com/maps?q=Caff%C3%A8+Cubano+Mantova' },
      { t:'Mantova Outlet Village', k:'provare', m:'https://www.google.com/maps?q=Mantova+Outlet+Village' },
      { t:'Skyline dal Ponte di San Giorgio', k:'provare', m:'https://www.google.com/maps?q=Ponte+di+San+Giorgio+Mantova' },
      { t:'Crociera tra i laghi, Mincio & fiori di loto', k:'provare', m:'https://www.google.com/maps?q=Crociera+laghi+Mantova+fiori+di+loto' },
      { t:'I Barcaioli del Mincio', k:'provare', m:'https://www.google.com/maps?q=Barcaioli+del+Mincio' },
      { t:'Degustazione in caseificio (Latteria San Pietro, Goito)', k:'provare', m:'https://www.google.com/maps?q=Latteria+San+Pietro+Goito' },
      { t:'Cru caviar experience (Parco del Mincio)', k:'provare', m:'https://www.google.com/maps?q=Parco+del+Mincio' },
      { t:'Sabbioneta — “Piccola Atene”', k:'escursioni', m:'https://www.google.com/maps?q=Sabbioneta' },
      { t:'San Benedetto Po — Abbazia del Polirone', k:'escursioni', m:'https://www.google.com/maps?q=San+Benedetto+Po' },
      { t:'Viadana — fascino del Grande Fiume', k:'escursioni', m:'https://www.google.com/maps?q=Viadana' },
      { t:'Bosco Fontana — a piedi con i Gonzaga', k:'escursioni', m:'https://www.google.com/maps?q=Bosco+Fontana' },
      { t:'Via del riso: Mantova → Castel d’Ario', k:'escursioni', m:'https://www.google.com/maps?q=Castel+d%27Ario' },
      { t:'Via dei mulini: Borghetto → Lago di Garda', k:'escursioni', m:'https://www.google.com/maps?q=Borghetto+Valeggio+sul+Mincio' },
      { t:'Nella terra del tartufo: Revere', k:'escursioni', m:'https://www.google.com/maps?q=Revere' },
      { t:'Colline moreniche del Garda', k:'escursioni', m:'https://www.google.com/maps?q=Colline+moreniche+del+Garda' },
      { t:'La città vista dai laghi — in motonave', k:'escursioni', m:'https://www.google.com/maps?q=Motonave+Mantova' },
      { t:'Autostrada verde: Mantova → Peschiera', k:'escursioni', m:'https://www.google.com/maps?q=Pista+Ciclabile+Mincio+Mantova+Peschiera' },
      { t:'Parco Sigurtà — il giardino paradiso', k:'escursioni', m:'https://www.google.com/maps?q=Parco+Giardino+Sigurt%C3%A0' }
    ];

    var css = [
      '.bacheca-widget{--bw-border: rgba(0,0,0,.08);--bw-bg:transparent;--bw-text:inherit;}',
      '.bacheca-widget .bw-header{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin:.75rem 0}',
      '.bacheca-widget h2{margin:0;font-size:clamp(18px,2.6vw,24px)}',
      '.bacheca-widget .bw-legend{display:flex;gap:.5rem;flex-wrap:wrap}',
      '.bacheca-widget .bw-tag{display:inline-flex;align-items:center;gap:.5rem;padding:.35rem .6rem;border-radius:999px;border:1px solid var(--bw-border);background:#fff}',
      '.bacheca-widget .bw-tag::before{content:"";width:.6rem;height:.6rem;border-radius:999px;background:#64748b}',
      '.bacheca-widget .bw-tag.vedere::before{background:#22c55e}',
      '.bacheca-widget .bw-tag.provare::before{background:#f59e0b}',
      '.bacheca-widget .bw-tag.escursioni::before{background:#3b82f6}',
      '.bacheca-widget .bw-scroller{position:relative;overflow:hidden;border:1px solid var(--bw-border);border-radius:14px;background:#fff}',
      '.bacheca-widget .bw-scroller::before,.bacheca-widget .bw-scroller::after{content:"";position:absolute;top:0;bottom:0;width:40px;pointer-events:none}',
      '.bacheca-widget .bw-scroller::before{left:0;background:linear-gradient(to right,#fff,rgba(255,255,255,0))}',
      '.bacheca-widget .bw-scroller::after{right:0;background:linear-gradient(to left,#fff,rgba(255,255,255,0))}',
      '.bacheca-widget .bw-strip{display:flex;gap:.5rem;align-items:center;padding:.6rem;will-change:transform}',
      '.bacheca-widget .bw-scroller:hover .bw-strip{animation-play-state:paused}',
      '.bacheca-widget .bw-item{display:inline-flex;align-items:center;gap:.6rem;padding:.5rem .75rem;border-radius:999px;border:1px solid var(--bw-border);background:#fff;white-space:nowrap}',
      '.bacheca-widget .bw-dot{width:.5rem;height:.5rem;border-radius:999px;background:#64748b}',
      '.bacheca-widget .bw-item.vedere .bw-dot{background:#22c55e}',
      '.bacheca-widget .bw-item.provare .bw-dot{background:#f59e0b}',
      '.bacheca-widget .bw-item.escursioni .bw-dot{background:#3b82f6}',
      '.bacheca-widget a{color:inherit;text-decoration:none}',
      '.bacheca-widget a:hover{text-decoration:underline}',
      '.bacheca-widget .bw-header.hidden{display:none}@keyframes bw-autoscroll{from{transform:translateX(0)}to{transform:translateX(var(--bw-to,-50%))}}'
    ].join('');
    var style = document.createElement('style'); style.setAttribute('data-bacheca-widget',''); style.textContent = css;
    document.head.appendChild(style);

    var container = document.createElement('div');
    container.className = 'bacheca-widget';
    container.innerHTML = [
      '<div class="bw-header' + (hideTitle ? ' hidden' : '') + '"><h2>'+titleText+'</h2>',
      '<div class="bw-legend">',
        '<span class="bw-tag vedere">Cosa vedere</span>',
        '<span class="bw-tag provare">Da provare</span>',
        '<span class="bw-tag escursioni">Escursioni</span>',
      '</div></div>',
      '<div class="bw-scroller" role="region" aria-label="Consigli in scorrimento">',
        '<ul class="bw-strip" aria-live="polite"></ul>',
      '</div>'
    ].join('');

    el.appendChild(container);

    var strip = container.querySelector('.bw-strip');
    function makeNodes(){
      var frag = document.createDocumentFragment();
      DATA.forEach(function(d){
        var li = document.createElement('li'); li.className = 'bw-item ' + d.k;
        li.innerHTML = '<span class="bw-dot"></span><a target="_blank" rel="noopener nofollow ugc"></a>';
        var a = li.querySelector('a'); a.href = d.m || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(d.t + ' Mantova')); a.textContent = d.t;
        frag.appendChild(li);
      });
      return frag;
    }
    strip.appendChild(makeNodes());
    strip.appendChild(makeNodes());

    requestAnimationFrame(function(){
      var total = strip.scrollWidth/2;
      var speed = 100;
      var dur = Math.max(18, Math.round(total / speed));
      strip.style.setProperty('--bw-to', '-' + total + 'px');
      strip.style.animation = 'bw-autoscroll ' + dur + 's linear infinite';
    });
  }catch(e){ console.error('Bacheca widget error:', e); }
})();
