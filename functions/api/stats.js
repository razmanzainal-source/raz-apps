// GET /api/stats?key=XXX  → ringkasan kaunter
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  // Kunci disimpan dalam KV (bukan repo, bukan env) supaya kekal selepas deploy.
  const expected = (await env.STATS.get('cfg:key')) || env.STATS_KEY;
  if (!key || !expected || key !== expected) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  const names = [];
  let cursor;
  do {
    const page = await env.STATS.list({ cursor, limit: 1000 });
    page.keys.forEach((k) => names.push(k.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const values = {};
  await Promise.all(
    names.map(async (n) => {
      values[n] = Number(await env.STATS.get(n)) || 0;
    })
  );

  const totals = {};
  const apps = {};
  const days = {};
  const geo = {};
  const device = {};
  const ref = {};
  const bot = {};

  for (const [k, v] of Object.entries(values)) {
    const parts = k.split(':');
    const type = parts[0];

    if (type === 'total') {
      totals[parts[1]] = v;
    } else if (type === 'app') {
      const [slug, t] = [parts[1], parts[2]];
      (apps[slug] = apps[slug] || {})[t] = v;
    } else if (type === 'day') {
      const [d, t] = [parts[1], parts[2]];
      (days[d] = days[d] || {})[t] = v;
    } else if (type === 'geo') {
      geo[parts[1]] = v;
    } else if (type === 'dev') {
      device[parts[1]] = v;
    } else if (type === 'ref') {
      ref[parts[1]] = v;
    } else if (type === 'bot') {
      bot[parts[1]] = v;
    }
  }

  return json({ ok: true, totals, apps, days, geo, device, ref, bot });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
