// Kaunter ringan untuk Raz Apps.
// POST /api/hit  { t: "page"|"apk"|"browser"|"ios"|"share", s: "<slug>", r: "<sumber>" }
// Tiada IP, tiada cookie, tiada profil individu — hanya pembilang agregat.

const ALLOWED = new Set(['page', 'apk', 'browser', 'ios', 'share']);

// Bot / crawler / scanner tidak dikira sebagai pelawat manusia.
const BOT_UA = /bot|crawl|spider|headless|phantom|puppeteer|playwright|python|curl|wget|scrapy|monitor|uptime|pingdom|lighthouse|preview|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|embedly|scan|security|nikto|nmap|masscan|zgrab|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claude|ccbot/i;

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const t = String(body.t || '').slice(0, 20);
    if (!ALLOWED.has(t)) return json({ ok: false }, 400);

    const ua = request.headers.get('user-agent') || '';
    const cc = (request.cf && request.cf.country) || 'XX';

    // Buang bot dari statistik manusia, tetapi tetap direkod berasingan.
    if (!ua || BOT_UA.test(ua)) {
      await bump(env, `bot:${t}`);
      await bump(env, `botgeo:${cc}`);
      return json({ ok: true, bot: true });
    }

    const s = String(body.s || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
    const day = new Date().toISOString().slice(0, 10);
    const dev = deviceOf(ua);
    const ref = String(body.r || 'direct').replace(/[^a-z0-9._-]/gi, '').slice(0, 16) || 'direct';

    const keys = [`total:${t}`, `day:${day}:${t}`];
    if (s) keys.push(`app:${s}:${t}`);

    // Metadata hanya untuk lawatan halaman (bukan setiap klik) supaya KV ringan.
    if (t === 'page') {
      keys.push(`geo:${cc}:page`);
      keys.push(`dev:${dev}:page`);
      keys.push(`ref:${ref}:page`);
    }

    await Promise.all(keys.map((k) => bump(env, k)));
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e).slice(0, 120) }, 400);
  }
}

export async function onRequestGet({ env }) {
  const list = await env.STATS.list({ limit: 20 });
  return json({ ok: true, keys: list.keys.map((k) => k.name) });
}

async function bump(env, key) {
  const cur = Number(await env.STATS.get(key)) || 0;
  await env.STATS.put(key, String(cur + 1));
}

function deviceOf(ua) {
  const u = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(u)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(u)) return 'mobile';
  return 'desktop';
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
