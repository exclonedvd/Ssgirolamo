# CHANGELOG – Patch UI-preserving

## Added
- `manifest.webmanifest` (PWA manifest: name, start_url, scope, display, theme/background color, icons 192/512).
- `robots.txt` and `sitemap.xml` (template with example domain).

## HTML (`index.html`)
- Open Graph + Twitter Card meta tags.
- Dynamic canonical link (`<link rel="canonical" id="canonical">` + small in-head script to set correct absolute URL).
- `<meta name="color-scheme" content="light">` and preconnect to jsDelivr CDN.
- Skip-link for accessibility (inserito dopo `<body>` e stile aggiunto in CSS).
- `<main>` ora ha `id="main"` per skip-link.
- Lightbox ora ha `role="dialog"` e `aria-modal="true"`.
- Sicurezza: `rel="noopener noreferrer"` su link con `target="_blank"`.
- Logo `<img>`: `decoding="async"`.

## CSS (`styles.css`)
- Aggiunte regole `.skip-link` visibili solo a focus (nessun impatto visivo normale).

## JavaScript (`app.js`)
- Menu drawer: gestione ARIA (`aria-expanded` sul bottone; `aria-hidden` con stringa) e chiusura aggiorna stato ARIA.
- Galleria: `img.decoding='async'` oltre a `loading='lazy'`.
- I18N: aggiornamento dinamico di `<html lang="…">` quando cambia la lingua.
- PWA: registrazione Service Worker con `{ updateViaCache: 'none' }`.

## Note
- EmailJS rimane **commentato**: se/quando lo abiliti, lascia `defer` per evitare blocchi al parsing.
- Sostituisci in `sitemap.xml` e, se vuoi, imposta un `og:image` dedicato.
