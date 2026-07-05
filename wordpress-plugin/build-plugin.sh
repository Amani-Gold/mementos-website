#!/usr/bin/env bash
# Build the Vite app and assemble the installable WordPress plugin zip.
#
#   ./wordpress-plugin/build-plugin.sh
#
# Output: wordpress-plugin/mementos-studio.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN="$ROOT/wordpress-plugin/mementos-studio"
APP="$PLUGIN/assets/app"

echo "==> Building Vite app"
cd "$ROOT"
npx vite build >/dev/null

echo "==> Assembling plugin assets"
rm -rf "$APP"
mkdir -p "$APP"
cp -r "$ROOT/dist/." "$APP/"

# Fixed entry filenames so PHP can enqueue them.
JS="$(ls "$APP"/assets/index-*.js | head -1)"
CSS="$(ls "$APP"/assets/index-*.css | head -1)"
mv "$JS" "$APP/assets/mementos-app.js"
mv "$CSS" "$APP/assets/mementos-app.css"

# Trim things the plugin does not use: the standalone HTML and the hashed
# collection images that Vite bundled from index.html (the real photos live in
# assets/app/Collections, /spreads, etc.).
rm -f "$APP/index.html"
find "$APP/assets" -maxdepth 1 -type f \( -name '*.jpeg' -o -name '*.jpg' -o -name '*.png' -o -name '*.webp' \) -delete

echo "==> Zipping"
cd "$ROOT/wordpress-plugin"
rm -f mementos-studio.zip
zip -qr mementos-studio.zip mementos-studio -x '*.DS_Store'

SIZE="$(du -h mementos-studio.zip | cut -f1)"
echo "==> Done: wordpress-plugin/mementos-studio.zip ($SIZE)"
