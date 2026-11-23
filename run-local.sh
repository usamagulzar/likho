#!/usr/bin/env bash
# Likho: run locally for testing.
#   ./run-local.sh          Local-only mode (default): no database, no account needed.
#                           Notes are saved in your browser. Sign-in is disabled.
#   ./run-local.sh --cloud  Re-enable the Neon database (asks for DATABASE_URL on first use).
#   ./run-local.sh --cloud --reset   Enter a different database URL.
set -euo pipefail
cd "$(dirname "$0")"

command -v node >/dev/null || { echo "Node.js 20+ is required: https://nodejs.org"; exit 1; }
if ! command -v pnpm >/dev/null; then
  echo "Installing pnpm..."
  (corepack enable && corepack prepare pnpm@latest --activate) 2>/dev/null || npm install -g pnpm
fi

CLOUD=0; RESET=0
for a in "$@"; do
  [ "$a" = "--cloud" ] && CLOUD=1
  [ "$a" = "--reset" ] && RESET=1
done

echo "Installing dependencies..."
pnpm install

if [ "$CLOUD" = "0" ]; then
  # Local-only: make sure no leftover database settings are picked up.
  unset DATABASE_URL BETTER_AUTH_SECRET BETTER_AUTH_URL
  [ -f .env.local ] && mv .env.local .env.local.cloud-backup && echo "Moved .env.local to .env.local.cloud-backup (database disabled)."
  echo
  echo "Local-only mode: database OFF. Notes are stored in your browser."
  echo "Starting Likho at http://localhost:3000  (Ctrl+C to stop)"
  exec pnpm dev
fi

# Cloud mode
[ "$RESET" = "1" ] && rm -f .env.local
if [ ! -f .env.local ]; then
  if [ -f .env.local.cloud-backup ]; then
    mv .env.local.cloud-backup .env.local
    echo "Restored saved database settings."
  else
    echo
    echo "Paste your Neon pooled connection string (keep sslmode=require)."
    read -r -p "DATABASE_URL: " DB_URL
    [ -n "$DB_URL" ] || { echo "DATABASE_URL is required."; exit 1; }
    SECRET="$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
    cat > .env.local <<ENV
DATABASE_URL=$DB_URL
BETTER_AUTH_SECRET=$SECRET
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GMAIL_USER=
GMAIL_APP_PASSWORD=
ENV
  fi
fi
echo "Applying database migrations..."
pnpm db:migrate
echo "Starting Likho (cloud mode) at http://localhost:3000"
exec pnpm dev
