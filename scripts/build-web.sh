#!/usr/bin/env bash
# Bina versi web untuk app showcase.
#   ./scripts/build-web.sh            # semua app
#   ./scripts/build-web.sh <slug>     # satu app
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE="$(cd "$ROOT/.." && pwd)"
BASE="/raz-apps/apps"

# slug di showcase : folder projek Flutter
declare -A PROJECTS=(
  [kataquest]="kataquest"
  [matematik-tahun3]="matematik_tahun3"
  [sains-tahun2]="sains_tahun2"
  [sains-tahun5]="sains_tahun5"
  [sejarah-tahun5]="sejarah_tahun5"
  [ulangkaji-upkk]="ulangkaji_upkk"
  [papan-kira]="papan_kira"
  [neon-beat]="rhythm_lan_battle"
  [volt-arena]="volt_arena"
)

# App yang belum boleh build web (plugin guna dart:ffi / firebase sahaja)
SKIP=(membaca-menulis voiceless hidup-plus)

build_one() {
  local slug="$1"
  local proj="${PROJECTS[$slug]:-}"

  if [[ -z "$proj" ]]; then
    echo "!! '$slug' tiada dalam senarai projek. Tambah dalam PROJECTS." >&2
    return 1
  fi

  local dir="$WORKSPACE/$proj"
  [[ -d "$dir" ]] || { echo "!! folder $dir tidak wujud" >&2; return 1; }

  echo "==> $slug  ($proj)"
  ( cd "$dir" && flutter build web --release --base-href "$BASE/$slug/" --no-wasm-dry-run >/dev/null )

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

if [[ $# -gt 0 ]]; then
  for slug in "$@"; do build_one "$slug"; done
else
  for slug in "${!PROJECTS[@]}"; do build_one "$slug"; done
fi

echo
echo "Siap. Jangan lupa: git add -A && git commit -m 'Bina semula web' && git push"
