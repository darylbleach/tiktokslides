#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE="$ROOT/data/chrome-profile"
PORT="${SLIDE_RESEARCH_CDP_PORT:-9222}"

mkdir -p "$PROFILE"

if [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif command -v google-chrome >/dev/null 2>&1; then
  CHROME="$(command -v google-chrome)"
elif command -v chromium >/dev/null 2>&1; then
  CHROME="$(command -v chromium)"
else
  echo "Google Chrome not found. Install Chrome and try again." >&2
  exit 1
fi

if curl -sf "http://127.0.0.1:${PORT}/json/version" >/dev/null 2>&1; then
  echo "Chrome is already exposing DevTools on port ${PORT}."
  echo "Log into TikTok in that window if you have not already, then leave it open."
  exit 0
fi

echo "Starting a dedicated Chrome profile for tiktokslides."
echo "Log into TikTok in this window, then leave it visible."
echo "Remote debugging: 127.0.0.1:${PORT}"

exec "$CHROME" \
  --remote-debugging-port="$PORT" \
  --remote-debugging-address=127.0.0.1 \
  --user-data-dir="$PROFILE" \
  --no-first-run \
  --no-default-browser-check \
  --disable-features=Translate \
  "https://www.tiktok.com/login"
