#!/usr/bin/env bash
# One-time setup of the database (Neon) and hosting (Vercel). Safe to re-run.
# Usage: ADMIN_EMAILS=you@gmail.com [APP_URL=https://...] npm run infra:setup
set -euo pipefail

: "${ADMIN_EMAILS:?Set ADMIN_EMAILS to the emails of the first admins (comma-separated)}"
APP_URL="${APP_URL:-https://sunday-koura.vercel.app}"
NAME=sunday-koura
DB=sunday_koura

# Neon project in Frankfurt, next to the Vercel functions (fra1).
project_id=$(npx neonctl projects list --output json |
  node -e 'const p=JSON.parse(require("fs").readFileSync(0));const l=Array.isArray(p)?p:p.projects;console.log(l.find(x=>x.name===process.argv[1])?.id??"")' "$NAME")
if [ -z "$project_id" ]; then
  echo "Creating Neon project $NAME…"
  project_id=$(npx neonctl projects create --name "$NAME" --region-id aws-eu-central-1 \
    --database "$DB" --output json |
    node -e 'const p=JSON.parse(require("fs").readFileSync(0));console.log(p.project.id)')
fi
# Saves the project in .neon so later neonctl commands use it.
npx neonctl set-context --project-id "$project_id"

echo "Linking Vercel project $NAME…"
npx vercel link --yes --project "$NAME"

existing=$(npx vercel env ls production 2>/dev/null || true)
set_env() { npx vercel env add "$1" production --value "$2" --force --yes >/dev/null; }

# The app uses Neon's pooled endpoint, made for many short serverless connections.
set_env DATABASE_URL "$(npx neonctl connection-string --database-name "$DB" --pooled)"
set_env BETTER_AUTH_URL "$APP_URL"
set_env ADMIN_EMAILS "$ADMIN_EMAILS"
set_env APP_TIMEZONE "Europe/Paris"
# Never rotate the secret on re-runs: that would sign everybody out.
if ! grep -q BETTER_AUTH_SECRET <<<"$existing"; then
  set_env BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
fi

echo "Done. Next: add the OAuth keys (see DEPLOY.md), then npm run deploy."
