/* Raz Apps — showcase
   Data-driven: edit data/apps.json sahaja untuk tambah/kemas kini app. */

const Icons = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>',
  apple: '<svg viewBox="0 0 24 24"><path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.7-1.8-3.3-1.8-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1 8.6.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.2-2.4-.1 0-2.5-1-2.5-3.7zM14.3 5.7c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z" fill="currentColor" stroke="none"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>'
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

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function releaseUrl(file) {
  return `https://github.com/${CONFIG.repo}/releases/latest/download/${encodeURIComponent(file)}`;
}

function actionButtons(app, compact = false) {
  const out = [];

  if (app.web) {
    out.push(`<a class="btn btn-primary" href="${esc(app.web)}" target="_blank" rel="noopener">
      ${Icons.play} Cuba dalam browser
    </a>`);
  }

  if (app.apk) {
    const label = compact ? 'APK' : `Muat turun APK${app.apk.size ? ` · ${esc(app.apk.size)}` : ''}`;
    out.push(`<a class="btn btn-secondary" href="${esc(releaseUrl(app.apk.file))}"
      download rel="noopener" title="Android · ${esc(app.apk.label || 'APK')}">
      ${Icons.download} ${label}
    </a>`);
  }

  if (app.ios) {
    out.push(`<a class="btn btn-ghost" href="${esc(app.ios)}" target="_blank" rel="noopener">
      ${Icons.apple} App Store
    </a>`);
  }

  if (!out.length) {
    out.push(`<span class="btn btn-ghost" style="pointer-events:none">Akan datang</span>`);
  }

  return out.join('');
}

function cardHtml(app) {
  const tags = (app.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const meta = [`v${esc(app.version || '1.0.0')}`];
  if (app.web) meta.push('Web');
  if (app.apk) meta.push(`Android · ${esc(app.apk.label || 'APK')}`);
  if (app.ios) meta.push('iOS');

  return `
  <article class="card" data-slug="${esc(app.slug)}">
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
      if (e.target.closest('a')) return; // biar butang buat kerja sendiri
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
  dlg.showModal();
  dlg.scrollTop = 0;
}

function wireDialogs() {
  document.addEventListener('click', (e) => {
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

  renderStats();
  renderFilters();
  render();
}

init();
