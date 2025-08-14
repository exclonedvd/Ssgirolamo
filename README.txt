AGRITURISMO – Sito & PWA
=========================

Cartella: corte-san-girolamo-pwa

COME USARE
- Carica l'intera cartella su qualsiasi hosting statico (GitHub Pages, Netlify, Vercel, Aruba, ecc.).
- Apri index.html. La web app è una PWA installabile su Android/iOS (tramite "Aggiungi a Home").
- Offline: il service worker mette in cache layout e risorse principali.

DOVE SOSTITUIRE I CONTENUTI
- assets/Home.jpg  → immagine di sfondo dell'homepage
- assets/logo.jpg  → logo dell’agriturismo (usato anche per le icone PWA)
- assets/gallery/  → inserisci qui le foto della galleria (jpg/png/webp)
- assets/gallery.json → elenco file galleria (se vuoto, verrà mostrata Home.jpg)

MENU / SEZIONI
- Camere  (mostra "10 camere", evita prezzi)
- Colazioni / Ristoro
- Esperienze: apicoltura, orto, massaggi
- Galleria
- Mappa (embed con l'indirizzo)
- Contatti (indirizzo, telefono, social)

DATI FISSI (modificabili in index.html)
- Nome: Agriturismo Corte San Girolamo
- Indirizzo: Str. S. Girolamo, 1, 46100 Mantova MN
- Telefono: 347 800 8505
- Instagram: https://www.instagram.com/cortesangirolamo/?igsh=MTByZDhoNjFrcnp6OA==
- Facebook: https://www.facebook.com/share/16ZMHcQUD4/?mibextid=wwXIfr

NOTE TECNICHE
- Manifest: manifest.webmanifest (icone generate da logo.jpg; consigliata immagine quadrata)
- Service Worker: sw.js (cache semplice con strategia cache-first)
- Stili: styles.css (CSS vanilla, responsive, mobile-first)
- JS: app.js (menu, smooth scroll, galleria, PWA)

Per aggiornare i testi, modifica direttamente le sezioni in index.html.

AGGIUNTE (v2)
-------------
- Lightbox galleria: clic su una foto per aprirla a tutto schermo; frecce o tastiera ← → per navigare.
- Modulo CONTATTI (Netlify Forms). Funziona automaticamente su Netlify; in locale salva in localStorage a scopo test.
- Multilingua IT/EN/DE: pulsanti in alto a destra. Traduzioni in assets/i18n.json.
- Richiesta disponibilità (prenotazioni) senza prezzi: invio via Netlify Forms o EmailJS.

EMAILJS (opzionale)
-------------------
1) Apri index.html e togli il commento allo script EmailJS CDN.
2) In app.js imposta EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID.
3) Personalizza il template EmailJS con i campi del form.

NETLIFY FORMS
--------------
- Pubblica la cartella su Netlify. Le form 'contact' e 'booking' appariranno nella dashboard.
- Lo honeypot 'bot-field' riduce lo spam.
