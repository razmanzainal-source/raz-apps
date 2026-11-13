#!/usr/bin/env bash
# Bina versi web untuk app showcase.
#   ./scripts/build-web.sh              # semua app
#   ./scripts/build-web.sh papan-kira   # satu / beberapa app
#
# Nota: ditulis untuk bash 3.2 (versi lalai macOS) — tiada associative array.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE="$(cd "$ROOT/.." && pwd)"
# Cloudflare Pages (raz-apps.pages.dev) serve dari root.
# Untuk GitHub Pages, jalankan: BASE=/raz-apps ./scripts/build-web.sh
BASE="${BASE:-}"

# slug showcase -> folder projek Flutter
project_for() {
  case "$1" in
    kataquest)          echo "kataquest" ;;
    matematik-tahun3)   echo "matematik_tahun3" ;;
    sains-tahun2)       echo "sains_tahun2" ;;
    sains-tahun5)       echo "sains_tahun5" ;;
    sejarah-tahun5)     echo "sejarah_tahun5" ;;
    ulangkaji-upkk)     echo "ulangkaji_upkk" ;;
    papan-kira)         echo "papan_kira" ;;
    neon-beat)          echo "rhythm_lan_battle" ;;
    volt-arena)         echo "volt_arena" ;;
    *)                  echo "" ;;
  esac
}

# Semua slug yang ada versi web.
ALL_SLUGS="kataquest matematik-tahun3 sains-tahun2 sains-tahun5 sejarah-tahun5 ulangkaji-upkk papan-kira neon-beat volt-arena"

# App yang belum boleh build web (plugin guna dart:ffi / Firebase sahaja):
#   membaca-menulis, voiceless, hidup-plus

build_one() {
  slug="$1"
  proj="$(project_for "$slug")"

  if [ -z "$proj" ]; then
    echo "!! '$slug' tiada dalam project_for(). Tambah pemetaan dahulu." >&2
    return 1
  fi

  dir="$WORKSPACE/$proj"
  if [ ! -d "$dir" ]; then
    echo "!! folder tidak wujud: $dir" >&2
    return 1
  fi

  echo "==> $slug  ($proj)"
  ( cd "$dir" && flutter build web --release --base-href "$BASE/apps/$slug/" --no-wasm-dry-run >/dev/null )

  rm -rf "$ROOT/apps/$slug"
  cp -R "$dir/build/web" "$ROOT/apps/$slug"

  # Buang fail debug yang tidak digunakan oleh build JS biasa
  ( cd "$ROOT/apps/$slug"
    rm -f canvaskit/*.symbols canvaskit/skwasm* canvaskit/wimp*
    rm -rf canvaskit/webparagraph
    find . -name "*.symbols" -delete
    find . -name "*.map" -delete
  )

  echo "    $(du -sh "$ROOT/apps/$slug" | cut -f1)"
}

if [ $# -gt 0 ]; then
  for slug in "$@"; do build_one "$slug"; done
else
  for slug in $ALL_SLUGS; do build_one "$slug"; done
fi

echo
echo "Siap. Jangan lupa: git add -A && git commit -m 'Bina semula web' && git push"
