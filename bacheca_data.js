// Contenuti statici gratuiti (dalla lista che ci hai mandato)
window.BACHECA_LIST = [
  // --- Cosa vedere ---
  { title:'Palazzo Ducale', kind:'vedere', maps:'https://www.google.com/maps?q=Palazzo+Ducale+Mantova' },
  { title:'Castello di San Giorgio', kind:'vedere', maps:'https://www.google.com/maps?q=Castello+di+San+Giorgio+Mantova' },
  { title:'Museo Archeologico Nazionale', kind:'vedere', maps:'https://www.google.com/maps?q=Museo+Archeologico+Nazionale+Mantova' },
  { title:'Duomo di Mantova', kind:'vedere', maps:'https://www.google.com/maps?q=Duomo+di+Mantova' },
  { title:'Casa di Rigoletto', kind:'vedere', maps:'https://www.google.com/maps?q=Casa+di+Rigoletto+Mantova' },
  { title:'Teatro Bibiena', kind:'vedere', maps:'https://www.google.com/maps?q=Teatro+Bibiena+Mantova' },
  { title:'Basilica di Sant’Andrea', kind:'vedere', maps:'https://www.google.com/maps?q=Basilica+di+Sant%27Andrea+Mantova' },
  { title:'Biblioteca Teresiana', kind:'vedere', maps:'https://www.google.com/maps?q=Biblioteca+Comunale+Teresiana+Mantova' },
  { title:'Museo nazionale dei Vigili del Fuoco', kind:'vedere', maps:'https://www.google.com/maps?q=Museo+nazionale+dei+Vigili+del+Fuoco+Mantova' },
  { title:'Rotonda di San Lorenzo', kind:'vedere', maps:'https://www.google.com/maps?q=Rotonda+di+San+Lorenzo+Mantova' },
  { title:'Piazza Leon Battista Alberti', kind:'vedere', maps:'https://www.google.com/maps?q=Piazza+Leon+Battista+Alberti+Mantova' },
  { title:'Piazza delle Erbe e Torre dell’Orologio', kind:'vedere', maps:'https://www.google.com/maps?q=Piazza+delle+Erbe+Torre+dell%27Orologio+Mantova' },
  { title:'Casa del Mercante', kind:'vedere', maps:'https://www.google.com/maps?q=Casa+del+Mercante+Mantova' },
  { title:'Palazzo d’Arco', kind:'vedere', maps:'https://www.google.com/maps?q=Palazzo+d%27Arco+Mantova' },
  { title:'Loggia delle Pescherie', kind:'vedere', maps:'https://www.google.com/maps?q=Loggia+delle+Pescherie+Mantova' },
  { title:'Teatro Sociale', kind:'vedere', maps:'https://www.google.com/maps?q=Teatro+Sociale+Mantova' },
  { title:'Casa di Giulio Romano', kind:'vedere', maps:'https://www.google.com/maps?q=Casa+di+Giulio+Romano+Mantova' },
  { title:'Casa del Mantegna', kind:'vedere', maps:'https://www.google.com/maps?q=Casa+del+Mantegna+Mantova' },
  { title:'Tempio e Palazzo di San Sebastiano', kind:'vedere', maps:'https://www.google.com/maps?q=San+Sebastiano+Mantova' },
  { title:'Palazzo Te', kind:'vedere', maps:'https://www.google.com/maps?q=Palazzo+Te+Mantova' },
  { title:'Chiesa di Santa Maria del Gradaro', kind:'vedere', maps:'https://www.google.com/maps?q=Santa+Maria+del+Gradaro+Mantova' },

  // --- Da provare ---
  { title:'Pasticceria Antoniazzi', kind:'provare', maps:'https://www.google.com/maps?q=Pasticceria+Antoniazzi+Mantova' },
  { title:'Caffè Borsa', kind:'provare', maps:'https://www.google.com/maps?q=Caff%C3%A8+Borsa+Mantova' },
  { title:'Pande & Pane (pasta fresca e torta di rose)', kind:'provare', maps:'https://www.google.com/maps?q=Pande+e+Pane+Mantova' },
  { title:'Papas (lungolago)', kind:'provare', maps:'https://www.google.com/maps?q=Papas+Mantova' },
  { title:'La Zanzara (lungolago)', kind:'provare', maps:'https://www.google.com/maps?q=La+Zanzara+Mantova' },
  { title:'Caffè Cubano (cocktail)', kind:'provare', maps:'https://www.google.com/maps?q=Caff%C3%A8+Cubano+Mantova' },
  { title:'Mantova Outlet Village', kind:'provare', maps:'https://www.google.com/maps?q=Mantova+Outlet+Village' },
  { title:'Skyline dal Ponte di San Giorgio', kind:'provare', maps:'https://www.google.com/maps?q=Ponte+di+San+Giorgio+Mantova' },
  { title:'Crociera tra i laghi, Mincio & fiori di loto', kind:'provare', maps:'https://www.google.com/maps?q=Crociera+laghi+Mantova+fiori+di+loto' },
  { title:'I Barcaioli del Mincio', kind:'provare', maps:'https://www.google.com/maps?q=Barcaioli+del+Mincio' },
  { title:'Caseificio con degustazione (Latteria San Pietro - Goito)', kind:'provare', maps:'https://www.google.com/maps?q=Latteria+San+Pietro+Goito' },
  { title:'Cru caviar experience (Parco del Mincio)', kind:'provare', maps:'https://www.google.com/maps?q=Parco+del+Mincio' },

  // --- Escursioni ---
  { title:'Sabbioneta — “Piccola Atene”', kind:'escursioni', maps:'https://www.google.com/maps?q=Sabbioneta' },
  { title:'San Benedetto Po — l’abbazia del Polirone', kind:'escursioni', maps:'https://www.google.com/maps?q=San+Benedetto+Po' },
  { title:'Viadana — fascino del Grande Fiume', kind:'escursioni', maps:'https://www.google.com/maps?q=Viadana' },
  { title:'Bosco Fontana — a piedi con i Gonzaga', kind:'escursioni', maps:'https://www.google.com/maps?q=Bosco+Fontana' },
  { title:'La via del riso: Mantova → Castel d’Ario', kind:'escursioni', maps:'https://www.google.com/maps?q=Castel+d%27Ario' },
  { title:'La via dei mulini: Borghetto → Lago di Garda', kind:'escursioni', maps:'https://www.google.com/maps?q=Borghetto+Valeggio+sul+Mincio' },
  { title:'Nella terra del tartufo: Revere', kind:'escursioni', maps:'https://www.google.com/maps?q=Revere' },
  { title:'Le colline moreniche', kind:'escursioni', maps:'https://www.google.com/maps?q=Colline+moreniche+del+Garda' },
  { title:'La città vista dai laghi — giro in motonave', kind:'escursioni', maps:'https://www.google.com/maps?q=Motonave+Mantova' },
  { title:'L’autostrada verde: Mantova → Peschiera', kind:'escursioni', maps:'https://www.google.com/maps?q=Pista+Ciclabile+Mincio+Mantova+Peschiera' },
  { title:'Parco Sigurtà — il giardino paradiso', kind:'escursioni', maps:'https://www.google.com/maps?q=Parco+Giardino+Sigurt%C3%A0' }
];

// Eventuali consigli inviati e poi approvati (modifica qui per aggiungerli alla board locale)
window.BACHECA_COMMUNITY = [
  // esempio:
  // {nome:'Marta', categoria:'Cultura & Musei', luogo:'Piazza Sordello', consiglio:'Arrivate entro le 9:30 per parcheggiare facile.', link:'', created_at:'2025-08-10T10:00:00Z'}
];
