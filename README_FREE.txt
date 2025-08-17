# "Dicono di noi" – Variante 100% gratuita
Data: 2025-08-17 10:44

Questa variante **non utilizza API** e quindi **non richiede fatturazione** né chiavi. 
Cosa fa:
- Bottone **Scrivi una recensione su Google**
- Bottone **Leggi tutte le recensioni su Google**
- Mappa embedded gratuita (senza API key). I testi delle recensioni si aprono su Google.

## Come usarla nel tuo sito
1) Copia `index.html` (solo la sezione <section id="reviews-section">…) e `styles.css` dentro il tuo progetto.
2) Mantieni il link "Powered by Google".
3) Se preferisci l'embed ufficiale di Google Maps con **"Condividi → Incorpora una mappa"**:
   - Apri la tua scheda su Google Maps → Condividi → Incorpora una mappa → copia l'iframe `<iframe src="https://www.google.com/maps/embed?pb=...">`
   - Sostituisci l'attributo `src` dell'iframe in `index.html` con quello.

## Link utili già impostati
- Scrivi recensione: https://search.google.com/local/writereview?placeid=ChIJ6WvNfk7RgUcRMKUu2xyQZWQ
- Apri scheda su Google Maps: https://www.google.com/maps/search/?api=1&query_place_id=ChIJ6WvNfk7RgUcRMKUu2xyQZWQ&query=

## Nota
Se un domani volessi visualizzare i **testi** delle recensioni direttamente nel sito, servirà l'API Places (a consumo). 
