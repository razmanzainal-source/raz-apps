// Pratonton kongsi setiap app: /app/<slug>
//
// Menghidangkan index.html yang sama, tetapi menggantikan meta Open Graph /
// Twitter dengan maklumat app itu. Ini yang dibaca WhatsApp, Facebook, X dan
// Telegram semasa menjana kad pratonton.

const SITE = 'Raz Apps';

const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

function metaDescription(app) {
  let text = String(app.description || app.tagline || '').replace(/\s+/g, ' ').trim();
  if (text.length > 200) {
    text = text.slice(0, 197).replace(/\s+\S*$/, '') + '…';
  }
  return text;
}

export async function onRequestGet({ params, request, env }) {
  const slug = decodeURIComponent(String(params.slug || ''));
  const origin = new URL(request.url).origin;

  const asset = (path) => env.ASSETS.fetch(new URL(path, origin).toString());

  const [pageRes, dataRes] = await Promise.all([
    asset('/index.html'),
    asset('/data/apps.json'),
  ]);

  if (!pageRes.ok) return pageRes;

  let app = null;
  try {
    const data = await dataRes.json();
    app = (data.apps || []).find((a) => a.slug === slug) || null;
  } catch {
    app = null;
  }

  // Slug tidak wujud — kembali ke laman utama.
  if (!app) return Response.redirect(new URL('/', origin).toString(), 302);

  let html = await pageRes.text();

  const title = `${app.name} — ${app.tagline} | ${SITE}`;
  const description = metaDescription(app);
  const pageUrl = `${origin}/app/${encodeURIComponent(slug)}`;
  const image = `${origin}/assets/og/${encodeURIComponent(slug)}.png`;

  const head = [
    `<meta property="og:image:alt" content="${esc(app.name)} — ${esc(app.tagline)}">`,
    `<link rel="canonical" href="${esc(pageUrl)}">`,
    `<script>window.__APP_SLUG__=${JSON.stringify(slug)};</script>`,
  ].join('\n');

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${esc(pageUrl)}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(image)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(description)}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${esc(image)}">`)
    .replace(/<\/head>/, `${head}\n</head>`);

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
