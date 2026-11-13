#!/usr/bin/env bash
# Deploy laman showcase ke Cloudflare Pages.
#
# Sekali sahaja (login):
#   npx wrangler login
#
# Kemudian setiap kali nak deploy:
#   ./scripts/deploy-cloudflare.sh
#
# Atau guna API token (tanpa login interaktif):
#   CLOUDFLARE_API_TOKEN=xxxx ./scripts/deploy-cloudflare.sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="raz-apps"

cd "$ROOT"

echo "==> Sediakan dist/ (tanpa .git, scripts, README)"
rm -rf dist
rsync -a \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude 'scripts' \
  --exclude 'README.md' \
  --exclude '.DS_Store' \
  ./ dist/

echo "==> $(du -sh dist | cut -f1), $(find dist -type f | wc -l | tr -d ' ') fail"

echo "==> Deploy ke Cloudflare Pages"
npx --yes wrangler pages deploy dist --project-name="$PROJECT" --commit-dirty=true

echo
echo "Siap: https://$PROJECT.pages.dev"
