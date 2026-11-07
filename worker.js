/**
 * FOOTSCORE data proxy for Cloudflare Workers.
 * Provider token is stored only as a Worker secret: FOOTBALL_DATA_TOKEN.
 * FOOTSCORE_ORIGIN must be the exact HTTPS origin hosting the PWA.
 * The football-data.org Free tier returns delayed scores, not instant livescores.
 */
const ALLOWED = new Set(['SA','PL','PD','BL1','FL1','CL','DED','PPL','ELC','BSA','WC','EC']);
const CACHE_SECONDS = 600;

function corsHeaders(origin, allowedOrigin) {
  return {
    'Access-Control-Allow-Origin': origin === allowedOrigin ? allowedOrigin : 'null',
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function json(data, status, origin, allowedOrigin, cacheSeconds=0) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : 'no-store',
    ...corsHeaders(origin, allowedOrigin)
  };
  return new Response(JSON.stringify(data), {status, headers});
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = (env.FOOTSCORE_ORIGIN || '').trim();
    const cors = corsHeaders(origin, allowedOrigin);

    // Fail closed: configure the exact public HTTPS origin before deployment.
    if (!allowedOrigin || !/^https:\/\//i.test(allowedOrigin)) {
      return json({error:'Configurazione incompleta: imposta FOOTSCORE_ORIGIN con l’origine HTTPS esatta della PWA.'}, 503, origin, allowedOrigin);
    }
    if (origin !== allowedOrigin) {
      return new Response('Origine non autorizzata', {status:403, headers:{...cors, 'Cache-Control':'no-store'}});
    }
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:cors});
    if (request.method !== 'GET') return json({error:'Metodo non consentito.'},405,origin,allowedOrigin);

    if (url.pathname === '/api/health') {
      return json({ok:true,provider:'football-data.org',freeTier:true,liveInstantaneo:false,refreshMinutes:10,tokenConfigured:Boolean(env.FOOTBALL_DATA_TOKEN)},200,origin,allowedOrigin,30);
    }
    if (!env.FOOTBALL_DATA_TOKEN) {
      return json({error:'Token non configurato sul server. Aggiungi FOOTBALL_DATA_TOKEN tra i Worker secrets.'},503,origin,allowedOrigin);
    }

    const competition = (url.searchParams.get('competition') || 'SA').toUpperCase();
    if (!ALLOWED.has(competition)) return json({error:'Competizione non inclusa nella copertura gratuita configurata.'},400,origin,allowedOrigin);

    let path;
    if (url.pathname === '/api/matches') {
      const from = url.searchParams.get('dateFrom') || new Date().toISOString().slice(0,10);
      const to = url.searchParams.get('dateTo') || from;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
        return json({error:'Date non valide. Usa YYYY-MM-DD.'},400,origin,allowedOrigin);
      }
      const span = (Date.parse(to+'T00:00:00Z') - Date.parse(from+'T00:00:00Z')) / 86400000;
      if (span > 60) return json({error:'Intervallo massimo consentito: 60 giorni.'},400,origin,allowedOrigin);
      path = `/v4/competitions/${competition}/matches?dateFrom=${from}&dateTo=${to}`;
    } else if (url.pathname === '/api/standings') {
      path = `/v4/competitions/${competition}/standings`;
    } else {
      return json({error:'Endpoint non trovato.'},404,origin,allowedOrigin);
    }

    // Shared edge cache reduces duplicate provider requests across visitors.
    const cacheKey = new Request(`https://footscore-cache.local${path}`);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      const cachedHeaders = new Headers(cached.headers);
      cachedHeaders.set('Access-Control-Allow-Origin', allowedOrigin);
      cachedHeaders.set('Vary','Origin');
      return new Response(cached.body,{status:cached.status,headers:cachedHeaders});
    }

    let upstream;
    try {
      upstream = await fetch(`https://api.football-data.org${path}`, {
        headers:{'X-Auth-Token':env.FOOTBALL_DATA_TOKEN,'Accept':'application/json'}
      });
    } catch {
      return json({error:'Fonte calcistica temporaneamente irraggiungibile.'},502,origin,allowedOrigin);
    }
    const body = await upstream.text();
    if (!upstream.ok) {
      let detail = body;
      try { const parsed=JSON.parse(body); detail=parsed.message || parsed.error || body; } catch {}
      return json({error:`football-data.org (${upstream.status}): ${detail}`},upstream.status,origin,allowedOrigin);
    }

    const response = new Response(body,{status:200,headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':`public, max-age=${CACHE_SECONDS}`,
      ...cors
    }});
    ctx.waitUntil(cache.put(cacheKey,response.clone()));
    return response;
  }
};
