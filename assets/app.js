/* Raz Apps — showcase
   Data-driven: edit data/apps.json sahaja untuk tambah/kemas kini app. */

const Icons = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>',
  apple: '<svg viewBox="0 0 24 24"><path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.7-1.8-3.3-1.8-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1 8.6.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.2-2.4-.1 0-2.5-1-2.5-3.7zM14.3 5.7c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z" fill="currentColor" stroke="none"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v5h14v-5"/></svg>'
};

const CATEGORY_LABEL = {
  pendidikan: 'Pendidikan',
  permainan: 'Permainan',
  kesihatan: 'Kesihatan',
  alat: 'Alat'
};

let APP_LIST = [];
let CONFIG = {};
let activeCategory = 'semua';
let query = '';

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- kaunter ringan (tanpa IP/cookie) ---------- */
function refBucket() {
  const utm = (new URLSearchParams(location.search).get('utm_source') || '').toLowerCase();
  if (utm) return utm.slice(0, 12);

  const r = document.referrer || '';
  if (!r) return 'direct';

  let host = '';
  try { host = new URL(r).hostname.replace(/^www\./, ''); } catch { return 'other'; }

  if (/wa\.me|whatsapp/.test(host)) return 'whatsapp';
  if (/facebook|fb\./.test(host)) return 'facebook';
  if (/instagram/.test(host)) return 'instagram';
  if (/t\.me|telegram/.test(host)) return 'telegram';
  if (/google/.test(host)) return 'google';
  if (/tiktok/.test(host)) return 'tiktok';
  if (/youtube/.test(host)) return 'youtube';
  if (host.includes('raz-apps') || host.includes('github.io')) return 'internal';
  return 'other';
}

function track(type, slug = '') {
  try {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
    const payload = { t: type, s: slug };
    if (type === 'page') payload.r = refBucket();
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/hit', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/hit', {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'content-type': 'application/json' }
      }).catch(() => {});
    }
  } catch { /* diam sahaja */ }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function releaseUrl(file) {
  return `https://github.com/${CONFIG.repo}/releases/latest/download/${encodeURIComponent(file)}`;
}

function actionButtons(app, compact = false) {
  const out = [];

  if (app.comingSoon) {
    return `<span class="btn btn-soon" style="pointer-events:none">Coming soon</span>`;
  }

  if (app.web) {
    out.push(`<a class="btn btn-primary" href="${esc(app.web)}" target="_blank" rel="noopener"
      data-track="browser" data-slug="${esc(app.slug)}">
      ${Icons.play} Browser
    </a>`);
  }

  if (app.apk) {
    const label = compact ? 'APK' : `Muat turun APK${app.apk.size ? ` · ${esc(app.apk.size)}` : ''}`;
    out.push(`<a class="btn btn-secondary" href="${esc(releaseUrl(app.apk.file))}"
      download rel="noopener" title="Android · ${esc(app.apk.label || 'APK')}"
      data-track="apk" data-slug="${esc(app.slug)}">
      ${Icons.download} ${label}
    </a>`);
  }

  if (app.ios) {
    out.push(`<a class="btn btn-ghost" href="${esc(app.ios)}" target="_blank" rel="noopener"
      data-track="ios" data-slug="${esc(app.slug)}">
      ${Icons.apple} App Store
    </a>`);
  }

  if (!compact) {
    out.push(`<button class="btn btn-ghost" type="button" data-share="${esc(app.slug)}">
      ${Icons.share} Kongsi
    </button>`);
  }

  if (!out.length) {
    out.push(`<span class="btn btn-ghost" style="pointer-events:none">Akan datang</span>`);
  }

  return out.join('');
}

/* ---------- kongsi ---------- */

function shareMessage(app) {
  const lines = [`📚 *${app.name}* — ${app.tagline}`, '', app.description];

  if (app.comingSoon) {
    lines.push('', '⏳ Coming soon');
    return lines.join('\n');
  }

  const where = [];
  if (app.apk) where.push('Android (APK)');
  if (app.ios) where.push('iPhone (App Store)');
  if (app.web) where.push('cuba terus dalam browser');

  if (where.length) lines.push('', `📲 ${where.join(' · ')}`);
  lines.push('✅ Percuma · berfungsi luar talian');
  return lines.join('\n');
}

function shareLink(app) {
  return `${location.origin}${location.pathname}#${app.slug}`;
}

function siteMessage() {
  return [
    '📱 *Raz Apps* — semua aplikasi saya di satu tempat',
    '',
    'Aplikasi pendidikan & permainan untuk murid, guru dan ibu bapa.',
    'Percuma · berfungsi luar talian · Android & iPhone.',
    '',
    'Cuba dalam browser atau muat turun APK 👇'
  ].join('\n');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
}

function openShare({ title, text, url }) {
  const dlg = $('#share');
  const body = `${text}\n\n${url}`;
  $('#share-preview').textContent = body;

  const enc = encodeURIComponent;
  $('#share-wa').href = `https://wa.me/?text=${enc(body)}`;
  $('#share-tg').href = `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`;
  $('#share-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
  $('#share-x').href = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;

  const nativeBtn = $('#share-native');
  if (navigator.share) {
    nativeBtn.hidden = false;
    nativeBtn.onclick = () => navigator.share({ title, text, url }).catch(() => {});
  } else {
    nativeBtn.hidden = true;
  }

  const copyBtn = $('#share-copy');
  copyBtn.classList.remove('copied');
  copyBtn.lastChild.textContent = ' Salin link';
  copyBtn.onclick = async () => {
    const ok = await copyText(body);
    if (ok) {
      copyBtn.classList.add('copied');
      copyBtn.lastChild.textContent = ' Link disalin!';
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.lastChild.textContent = ' Salin link';
      }, 2000);
    }
  };

  dlg.showModal();
}

function shareApp(slug) {
  const app = APP_LIST.find((a) => a.slug === slug);
  if (!app) return;
  track('share', slug);
  openShare({ title: app.name, text: shareMessage(app), url: shareLink(app) });
}

function shareSite() {
  track('share', '');
  openShare({
    title: 'Raz Apps',
    text: siteMessage(),
    url: `${location.origin}${location.pathname}`
  });
}

function allAppsMessage() {
  const lines = [
    '📱 *RAZ APPS* — semua aplikasi dalam satu tempat',
    '',
    'Aplikasi pendidikan & permainan. Percuma, berfungsi luar talian.',
    ''
  ];

  APP_LIST.forEach((app, i) => {
    lines.push(`${i + 1}. *${app.name}* — ${app.tagline}`);
    if (app.comingSoon) {
      lines.push('   ⏳ Coming soon');
      lines.push('');
      return;
    }
    if (app.apk) lines.push(`   🤖 APK: ${releaseUrl(app.apk.file)}`);
    if (app.ios) lines.push(`   🍎 iPhone: ${app.ios}`);
    if (app.web) lines.push(`   🌐 Web: ${location.origin}/apps/${app.slug}/`);
    lines.push('');
  });

  lines.push('📌 Semua app: ' + `${location.origin}${location.pathname}`);
  return lines.join('\n');
}

function shareAll() {
  track('share', 'all');
  openShare({
    title: 'Raz Apps — semua aplikasi',
    text: allAppsMessage(),
    url: `${location.origin}${location.pathname}`
  });
}

function cardHtml(app) {
  const tags = (app.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const meta = app.comingSoon ? ['Coming soon'] : [`v${esc(app.version || '1.0.0')}`];
  if (!app.comingSoon) {
    if (app.web) meta.push('Web');
    if (app.apk) meta.push(`Android · ${esc(app.apk.label || 'APK')}`);
    if (app.ios) meta.push('iOS');
  }

  return `
  <article class="card" data-slug="${esc(app.slug)}">
    <button class="card-share" type="button" data-share="${esc(app.slug)}"
            aria-label="Kongsi ${esc(app.name)}" title="Kongsi">${Icons.share}</button>
    <div class="card-head">
      <img class="card-icon" src="${esc(app.icon)}" alt="" loading="lazy"
           onerror="this.style.visibility='hidden'">
      <div class="card-titles">
        <h3 class="card-name">${esc(app.name)}</h3>
        <p class="card-tagline">${esc(app.tagline)}</p>
      </div>
    </div>
    <p class="card-desc">${esc(app.description)}</p>
    <div class="tags">${tags}</div>
    <div class="card-actions">${actionButtons(app, true)}</div>
    <div class="card-meta">${meta.map((m) => `<span>${m}</span>`).join('<span>·</span>')}</div>
  </article>`;
}

function render() {
  const q = query.trim().toLowerCase();
  const list = APP_LIST.filter((app) => {
    const catOk = activeCategory === 'semua' || app.category === activeCategory;
    if (!catOk) return false;
    if (!q) return true;
    return [app.name, app.tagline, app.description, ...(app.tags || [])]
      .join(' ').toLowerCase().includes(q);
  });

  $('#grid').innerHTML = list.map(cardHtml).join('');
  $('#empty').hidden = list.length > 0;

  $$('.card').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return; // biar butang buat kerja sendiri
      openDetail(el.dataset.slug);
    });
  });
}

function renderFilters() {
  const cats = ['semua', ...new Set(APP_LIST.map((a) => a.category))];
  $('#filters').innerHTML = cats.map((c) => `
    <button class="chip" role="tab" data-cat="${esc(c)}"
      aria-selected="${c === activeCategory}">
      ${c === 'semua' ? 'Semua' : esc(CATEGORY_LABEL[c] || c)}
    </button>`).join('');

  $$('#filters .chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      render();
    });
  });
}

function renderStats() {
  const total = APP_LIST.length;
  const web = APP_LIST.filter((a) => a.web).length;
  const android = APP_LIST.filter((a) => a.apk).length;
  $('#stats').innerHTML = `
    <span class="stat"><strong>${total}</strong> aplikasi</span>
    <span class="stat"><strong>${web}</strong> boleh dicuba dalam browser</span>
    <span class="stat"><strong>${android}</strong> APK Android</span>`;
}

function openDetail(slug) {
  const app = APP_LIST.find((a) => a.slug === slug);
  if (!app) return;

  const shots = (app.shots || []).length
    ? `<div class="shots">${app.shots.map((s) =>
        `<img src="${esc(s)}" alt="Tangkapan skrin ${esc(app.name)}" loading="lazy">`).join('')}</div>`
    : '';

  const apkNote = app.apk
    ? `<p class="dl-note">APK ${esc(app.apk.size || '')} · ${esc(app.apk.label || 'universal')} ·
       <button type="button" class="linkish" data-open="guide">panduan pemasangan</button></p>`
    : '';

  $('#detail-body').innerHTML = `
    <div class="detail-head">
      <img src="${esc(app.icon)}" alt="">
      <div>
        <h2>${esc(app.name)}</h2>
        <p>${esc(app.tagline)}</p>
      </div>
    </div>
    <p class="detail-desc">${esc(app.description)}</p>
    <div class="detail-actions">${actionButtons(app)}</div>
    ${apkNote}
    ${shots}
  `;

  const dlg = $('#detail');
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;

  // URL boleh dikongsi: .../#slug
  if (location.hash !== `#${app.slug}`) {
    history.replaceState(null, '', `#${app.slug}`);
  }
}

function openFromHash() {
  const slug = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (slug && APP_LIST.some((a) => a.slug === slug)) openDetail(slug);
}

function wireDialogs() {
  document.addEventListener('click', (e) => {
    const trackEl = e.target.closest('[data-track]');
    if (trackEl) track(trackEl.dataset.track, trackEl.dataset.slug || '');

    const shareBtn = e.target.closest('[data-share]');
    if (shareBtn) {
      e.preventDefault();
      shareApp(shareBtn.dataset.share);
      return;
    }
    const opener = e.target.closest('[data-open]');
    if (opener) {
      const dlg = document.getElementById(opener.dataset.open);
      if (dlg) { dlg.showModal(); dlg.scrollTop = 0; }
      return;
    }
    const closer = e.target.closest('[data-close]');
    if (closer) closer.closest('dialog')?.close();
  });

  $$('dialog').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close(); // klik backdrop
    });
    dlg.addEventListener('close', () => {
      if (dlg.id === 'detail' && location.hash) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    });
  });
}

async function init() {
  wireDialogs();

  $('#search').addEventListener('input', (e) => {
    query = e.target.value;
    render();
  });

  try {
    const res = await fetch('data/apps.json', { cache: 'no-cache' });
    const data = await res.json();
    CONFIG = data.site || {};
    APP_LIST = data.apps || [];
  } catch (err) {
    console.error(err);
    $('#grid').innerHTML = `<p class="empty">Gagal memuatkan senarai aplikasi.</p>`;
    return;
  }

  if (CONFIG.title) document.title = `${CONFIG.title} — Preview & Muat Turun`;

  const siteBtn = $('#share-site');
  if (siteBtn) siteBtn.addEventListener('click', shareSite);

  const allBtn = $('#share-all');
  if (allBtn) allBtn.addEventListener('click', shareAll);

  window.addEventListener('hashchange', openFromHash);

  renderStats();
  renderFilters();
  render();
  openFromHash();
  track('page', '');
}

init();
