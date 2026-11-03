# Deploying Sunday Koura

Everything runs through `npm` scripts that drive the Neon and Vercel CLIs. Only the Google OAuth app needs clicking in a web console, because Google offers no CLI or API for that.

## 1. Sign in to the CLIs (once)

```bash
npx vercel login
npx neonctl auth
```

## 2. Create the database and the hosting project

```bash
ADMIN_EMAILS=you@gmail.com npm run infra:setup
```

This creates the Neon project `sunday-koura` (Frankfurt) and links the Vercel project `sunday-koura`. It also sets `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `ADMIN_EMAILS` and `APP_TIMEZONE`. If Vercel gives the project a different URL than `https://sunday-koura.vercel.app`, re-run it with `APP_URL=https://<real-url>`.

## 3. Google sign-in (about 5 min)

1. Go to https://console.cloud.google.com/ and create a project named "Sunday Koura".
2. **APIs & Services → OAuth consent screen**: External, app name "Sunday Koura", your email. Publish the app (scopes `email`, `profile` and `openid` need no review).
3. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origin: `https://sunday-koura.vercel.app`
   - Authorized redirect URI: `https://sunday-koura.vercel.app/api/auth/callback/google`
4. Then run:
   ```bash
   npx vercel env add GOOGLE_CLIENT_ID production
   npx vercel env add GOOGLE_CLIENT_SECRET production
   ```

## 4. Deploy

```bash
npm run deploy   # typecheck + lint, migrate the Neon database, deploy to production
npm run logs     # production logs
npx vercel rollback   # back to the previous deployment if something breaks
```

Run `npm run deploy` again for every release. Migrations run before the new code goes live.

## Costs and limits

- **Vercel Hobby**: free, for non-commercial use only. If you ever charge players through the app, move to Pro.
- **Neon Free**: 0.5 GB storage and 100 compute-hours a month. The database sleeps after 5 minutes idle, so the first visit after a quiet period takes about a second longer.
- Never set `E2E_TEST_LOGIN` in production. It turns on a password-less test sign-in.
