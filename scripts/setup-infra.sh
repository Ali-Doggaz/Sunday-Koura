#!/usr/bin/env bash
# One-time setup of the database (Neon) and hosting (Vercel). Safe to re-run.
# Usage: ADMIN_EMAILS=you@gmail.com [APP_URL=https://...] [NEON_ORG_ID=...] npm run infra:setup
set -euo pipefail

: "${ADMIN_EMAILS:?Set ADMIN_EMAILS to the emails of the first admins (comma-separated)}"
APP_URL="${APP_URL:-https://sunday-koura.vercel.app}"
NAME=sunday-koura

# The Neon organization: NEON_ORG_ID, or the account's only one.
org_id="${NEON_ORG_ID:-$(npx neonctl orgs list --output json |
  node -e 'const o=JSON.parse(require("fs").readFileSync(0));if(o.length!==1){console.error("Several Neon orgs: set NEON_ORG_ID");process.exit(1)}console.log(o[0].id)')}"

# Link this folder to the Neon project, creating it on the first run.
# Frankfurt, next to the Vercel functions (fra1).
project_id=$(npx neonctl projects list --org-id "$org_id" --output json |
  node -e 'const p=JSON.parse(require("fs").readFileSync(0));const l=Array.isArray(p)?p:p.projects;console.log(l.find(x=>x.name===process.argv[1])?.id??"")' "$NAME")
if [ -z "$project_id" ]; then
  echo "Creating Neon project ${NAME}..."
  npx neonctl link --yes --no-env-pull --org-id "$org_id" \
    --project-name "$NAME" --region-id aws-eu-central-1
else
  npx neonctl link --yes --no-env-pull --org-id "$org_id" --project-id "$project_id"
fi

echo "Linking Vercel project ${NAME}..."
npx vercel link --yes --project "$NAME"

existing=$(npx vercel env ls production 2>/dev/null || true)
set_env() { npx vercel env add "$1" --environment production --value "$2" --force --yes >/dev/null; }

# The app uses Neon's pooled endpoint, made for many short serverless connections.
set_env DATABASE_URL "$(npx neonctl connection-string --pooled)"
set_env BETTER_AUTH_URL "$APP_URL"
set_env ADMIN_EMAILS "$ADMIN_EMAILS"
set_env APP_TIMEZONE "Europe/Paris"
# Never rotate the secret on re-runs: that would sign everybody out.
if ! grep -q BETTER_AUTH_SECRET <<<"$existing"; then
  set_env BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
fi

echo "Done. Next: add the OAuth keys (see DEPLOY.md), then npm run deploy."
