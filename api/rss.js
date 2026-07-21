// Proxy RSS propio: corre como función serverless en Vercel.
// El pendón lo usa vía /api/rss?url=<feed> — sin depender de proxies públicos.
// Solo permite las URLs declaradas como feeds en config.json (no es un proxy abierto).
export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) { res.status(400).send('Falta el parametro url'); return; }
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const cfgR = await fetch(proto + '://' + req.headers.host + '/config.json');
    const cfg = cfgR.ok ? await cfgR.json() : {};
    const permitidas = (cfg.feeds || []).map(f => f.url);
    if (!permitidas.includes(url)) { res.status(403).send('URL no permitida'); return; }

    const r = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PendonLED/1.0; +https://pled.cl)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    const txt = await r.text();
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // cache corto en el CDN de Vercel: menos carga y respuesta instantánea
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(r.ok ? 200 : 502).send(txt);
  } catch (e) {
    res.status(500).send('Error al obtener el feed: ' + e.message);
  }
}
