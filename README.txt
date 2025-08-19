# Bacheca ospiti — versione 100% gratuita (statica)

Questa pagina mostra uno **scroller** con i consigli preselezionati (la tua lista) e include un **form Netlify** per raccogliere suggerimenti.
Per rimanere gratis al 100% non c'è nessuna API: i consigli approvati vanno copiati a mano in `bacheca_data.js` (array `BACHECA_COMMUNITY`).

## Come usare
1. Carica `bacheca.html`, `bacheca.css`, `bacheca.js`, `bacheca_data.js` nel tuo sito.
2. (Opzionale) Se usi Netlify, il form funziona subito. I messaggi arrivano nella dashboard, ma **non** vengono mostrati automaticamente.
3. Per aggiungere/aggiornare i consigli:
   - modifica l'array `BACHECA_LIST` (i nostri consigli) oppure
   - aggiungi elementi a `BACHECA_COMMUNITY` (consigli degli ospiti moderati).
4. Puoi cambiare i colori delle categorie nelle classi `.tag.vedere`, `.tag.provare`, `.tag.escursioni` nel CSS.

## Zero costi, zero dipendenze
- Nessuna API a pagamento, nessuna Function.
- Lo scroller è in puro CSS/JS; pausa al passaggio del mouse, link a Google Maps per ogni voce.
