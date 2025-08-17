// /.netlify/functions/bacheca-list
// Elenca gli ultimi consigli dalla form Netlify "bacheca-ospiti"
// Richiede 2 env var su Netlify:
// - NETLIFY_AUTH_TOKEN: token personale con accesso 'read' ai form
// - NETLIFY_SITE_ID: id del sito (Settings → Site details → API ID)
export async function handler(event, context) {
  const token = process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;
  const FORM_NAME = 'bacheca-ospiti';
  const ORIGIN = event.headers.origin || '*';

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': ORIGIN,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin'
      },
    };
  }

  if(!token || !siteId){
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': ORIGIN, 'Vary': 'Origin' },
      body: JSON.stringify({ error: 'Missing NETLIFY_AUTH_TOKEN or NETLIFY_SITE_ID' })
    };
  }

  try{
    // 1) trova il form ID
    const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/forms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if(!formsRes.ok) throw new Error('Forms HTTP ' + formsRes.status);
    const forms = await formsRes.json();
    const form = forms.find(f => f.name === FORM_NAME);
    if(!form){
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': ORIGIN, 'Content-Type': 'application/json', 'Vary': 'Origin' },
        body: JSON.stringify([])
      };
    }

    // 2) submissions
    const subsRes = await fetch(`https://api.netlify.com/api/v1/forms/${form.id}/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if(!subsRes.ok) throw new Error('Subs HTTP ' + subsRes.status);
    const subs = await subsRes.json();

    // 3) mappa campi → payload pubblico
    const tips = subs.map(s => {
      const f = s.data || s.fields || {};
      return {
        id: s.id,
        created_at: s.created_at,
        nome: (f.nome || '').toString().slice(0, 60),
        categoria: (f.categoria || '').toString().slice(0, 40),
        luogo: (f.luogo || '').toString().slice(0, 120),
        link: (f.link || '').toString().slice(0, 300),
        consiglio: (f.consiglio || '').toString().slice(0, 800)
      };
    })
    // banale filtro antispam (link eccessivi, parolacce base)
    .filter(t => (t.consiglio || '').length >= 10)
    .slice(-200) // limita a ultimi 200

    // Ordina per data crescente e poi verrà invertito lato client
    tips.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': ORIGIN,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Vary': 'Origin'
      },
      body: JSON.stringify(tips)
    };

  }catch(err){
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': ORIGIN, 'Vary': 'Origin' },
      body: JSON.stringify({ error: err.message })
    };
  }
}
