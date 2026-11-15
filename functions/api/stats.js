// GET /api/stats?key=XXX  → ringkasan kaunter
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key || key !== env.STATS_KEY) {
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

  for (const [k, v] of Object.entries(values)) {
    const [type, ...rest] = k.split(':');
    if (type === 'total') {
      totals[rest[0]] = v;
    } else if (type === 'app') {
      const [slug, t] = rest;
      (apps[slug] = apps[slug] || {})[t] = v;
    } else if (type === 'day') {
      const [d, t] = rest;
      (days[d] = days[d] || {})[t] = v;
    }
  }

  return json({ ok: true, totals, apps, days });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
