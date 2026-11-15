// Kaunter ringan untuk Raz Apps.
// POST /api/hit  { t: "page"|"apk"|"browser"|"ios"|"share"|"all", s: "<slug>" }
// Tiada IP, tiada cookie, tiada data peribadi — hanya nombor.

const ALLOWED = new Set(['page', 'apk', 'browser', 'ios', 'share', 'all', 'stats']);
const DAYS_KEEP = 400;

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const t = String(body.t || '').slice(0, 20);
    if (!ALLOWED.has(t)) return json({ ok: false }, 400);

    const s = String(body.s || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
    const day = new Date().toISOString().slice(0, 10);

    const keys = [
      `total:${t}`,
      `day:${day}:${t}`,
    ];
    if (s) keys.push(`app:${s}:${t}`);

    await Promise.all(keys.map(async (k) => {
      const cur = Number(await env.STATS.get(k)) || 0;
      await env.STATS.put(k, String(cur + 1));
    }));

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e).slice(0, 120) }, 400);
  }
}

export async function onRequestGet({ env }) {
  // senarai ringkas untuk debugging (tanpa kunci)
  const list = await env.STATS.list({ limit: 20 });
  return json({ ok: true, keys: list.keys.map((k) => k.name) });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
