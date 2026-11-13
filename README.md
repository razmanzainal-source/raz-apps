# Raz Apps — laman showcase

Satu laman untuk preview dan muat turun semua aplikasi.

- **Live:** https://razmanzainal-source.github.io/raz-apps/
- **APK:** disimpan sebagai aset GitHub Release, bukan dalam repo.

## Struktur

```
index.html            laman utama
assets/style.css      gaya
assets/app.js         logik (baca data/apps.json)
data/apps.json        ← SATU-SATUNYA fail yang perlu diedit untuk tambah app
assets/icons/         ikon app
assets/shots/         tangkapan skrin
apps/<slug>/          build Flutter web (jangan edit manual)
```

## Tambah / kemas kini app

Edit `data/apps.json`:

```json
{
  "slug": "nama-app",
  "name": "Nama App",
  "tagline": "Satu baris ringkas",
  "description": "Penerangan 1–2 ayat.",
  "icon": "assets/icons/nama-app.png",
  "shots": ["assets/shots/nama-app-1.png"],
  "category": "pendidikan",          // pendidikan | permainan | kesihatan | alat
  "tags": ["Matematik", "Tahun 3"],
  "version": "1.2.3",
  "web": "apps/nama-app/",           // null jika tiada versi web
  "apk": { "file": "nama-app-1.2.3.apk", "size": "72 MB", "label": "arm64" },
  "ios": "https://apps.apple.com/my/app/idXXXXXXXX"   // null jika tiada
}
```

Butang APK akan menunjuk ke:

```
https://github.com/razmanzainal-source/raz-apps/releases/latest/download/<file>
```

Ubah `site.repo` dalam `data/apps.json` jika nama repo berubah.

## Keluarkan versi baharu APK

```bash
gh release create v1.1.0 \
  edaran/nama-app-1.2.3.apk \
  --title "v1.1.0" --notes "Kemas kini"
```

Atau tambah aset pada release sedia ada:

```bash
gh release upload latest edaran/nama-app-1.3.0.apk --clobber
```

Kemudian kemas kini `apk.file` dalam `data/apps.json` supaya butang menunjuk
fail baharu.

## Bina semula versi web

```bash
./scripts/build-web.sh nama-app        # satu app
./scripts/build-web.sh                 # semua app
```

Skrip akan `flutter build web --base-href /raz-apps/apps/<slug>/`, salin ke
`apps/<slug>/` dan buang fail debug `canvaskit` yang tidak diperlukan.

## Nota had GitHub Pages

- Repo disyorkan kekal bawah **1 GB**. Saiz sekarang ~450 MB.
- Jika berkembang, pindahkan `apps/` ke Cloudflare Pages / R2 (bandwidth tanpa had).
- Latar belakang audio sesetengah app menyumbang saiz paling besar
  (`assets/assets/bunyi`).

## Deploy

```bash
git add -A && git commit -m "Kemas kini showcase" && git push
```

GitHub Pages akan deploy automatik dari branch `main` dalam beberapa minit.
