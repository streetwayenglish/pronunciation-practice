#!/usr/bin/env bash
# Copies the deployable site into www/, the folder Capacitor bundles into the
# native apps. Keeps the repo root as the single source of truth (still used
# as-is for GitHub Pages) instead of hand-maintaining two copies.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf www
mkdir -p www

rsync -a . www/ \
  --exclude .git \
  --exclude node_modules \
  --exclude www \
  --exclude ios \
  --exclude android \
  --exclude scripts \
  --exclude package.json \
  --exclude package-lock.json \
  --exclude capacitor.config.json \
  --exclude MOBILE_WRAP_PLAN.md \
  --exclude '*.md'

echo "www/ rebuilt from repo root."
