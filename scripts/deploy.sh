#!/usr/bin/env bash
# Checks the code, migrates the production database, then deploys to production.
set -euo pipefail

npm run typecheck
npm run lint

echo "Migrating the production database…"
# Migrations use the direct (non-pooled) endpoint.
DATABASE_URL="$(npx neonctl connection-string --database-name sunday_koura)" npx drizzle-kit migrate

npx vercel deploy --prod
