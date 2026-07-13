# VELION MARKETS

Professional brokerage platform — React, TypeScript, Vite, Tailwind, Supabase.

## Local development

```bash
npm ci
cp .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this repo to GitHub (already linked as `VELIONMARKETS` if using the project remote).
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo.
3. Framework preset: **Vite** (auto-detected via `vercel.json`).
4. Set environment variables (Production + Preview):

| Name | Required | Notes |
|------|----------|--------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_VAPID_PUBLIC_KEY` | No | Web Push public key |
| `VITE_ERROR_REPORTING_URL` | No | Optional error ingest |

5. Deploy. SPA routes, Binance market proxy, service worker, and video caching are configured in [`vercel.json`](vercel.json).

6. In Supabase → **Authentication → URL Configuration**, add:
   - Site URL: your production domain (e.g. `https://velionmarkets.com`)
   - Redirect URLs: `https://*.vercel.app/**` and your custom domain

7. Optional custom domain: Vercel Project → **Domains** → add `velionmarkets.com` / `www`.

### Important

- Never set `SUPABASE_SERVICE_ROLE_KEY` in Vercel for this frontend app.
- After changing `VITE_*` env vars, trigger a **redeploy** so Vite can bake them into the client bundle.
- Hero video ships from `public/videos/platform.mp4` (~8MB) — included in the static output.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview `dist/` locally |
| `npm run lint` | Oxlint |
| `npm run create-admin` | Create admin user (needs service role key locally) |
