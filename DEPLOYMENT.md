# VELION MARKETS — Deployment Guide

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) or [Netlify](https://netlify.com) account
- Domain registered: `velionmarkets.com`

## 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com/dashboard
2. Go to **SQL Editor** and run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_ai_trading.sql` — **required for AI Trading page**
   - `supabase/migrations/003_transaction_notifications.sql`
   - `supabase/migrations/004_admin_deposit_delete.sql` (if using admin deposit delete)
   - `supabase/migrations/005_deposit_config_seed.sql` (optional deposit setup defaults)
   - `supabase/migrations/006_push_subscriptions.sql` (browser push notifications)
   - `supabase/migrations/007_ai_subscription_balance.sql` (AI bot balance debit)
3. Go to **Settings > API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`
4. Go to **Authentication > Settings** and enable Email provider
5. Create your first admin user (choose one method):

   **Option A — automated (recommended)**
   ```bash
   # Add SUPABASE_SERVICE_ROLE_KEY to .env (Dashboard → Settings → API → service_role)
   npm run create-admin
   ```
   Default credentials:
   - Email: `tradno.admin@gmail.com`
   - Password: `Tradno@Admin2026!`
   Create the Gmail at https://accounts.google.com/signup if you want a real inbox.

   **Option B — manual**
   - Register via the app at `/auth`
   - In Supabase SQL Editor, run:
     ```sql
     UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
     ```
   - Sign in at `/admin-auth`

## 2. Supabase MCP (Cursor AI Integration)

The project includes `.cursor/mcp.json` for Supabase MCP so Cursor can manage your database directly.

1. Go to https://supabase.com/dashboard/account/tokens
2. Create a **Personal Access Token**
3. Open `.cursor/mcp.json` and paste your token into `SUPABASE_ACCESS_TOKEN`
4. Reload Cursor: `Ctrl+Shift+P` → **Developer: Reload Window**
5. Verify in **Settings → Features → MCP** — Supabase should show green with tools available

Optional: add `--project-ref=YOUR_PROJECT_REF` to the args array to scope MCP to one project.

## 3. Local Development

```bash
cp .env.example .env
# Edit .env with your Supabase credentials

npm install
npm run dev
```

Visit http://localhost:5173

## 4. Deploy to Vercel

```bash
npm run build
npx vercel
```

Or connect your GitHub repo to Vercel:
1. Import the repository
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

### Vercel SPA Routing

`vercel.json` is already configured for client-side routing.

## 5. Custom Domain

1. In Vercel: **Settings > Domains** → Add `velionmarkets.com`
2. Update DNS at your registrar per Vercel instructions
3. SSL is automatic via Vercel

## 6. Email Setup (Optional)

Configure custom email for `support@velionmarkets.com` at your domain registrar or Google Workspace.

## 7. Post-Launch Checklist

- [ ] Test user registration and login
- [ ] Test KYC document upload
- [ ] Test deposit/withdrawal flows (admin approval)
- [ ] Verify certificate lookup at `/verify` with ID `HLS-2024-0001`
- [ ] Test admin panel at `/admin-auth`
- [ ] Confirm all marketing pages load correctly
- [ ] Check mobile responsiveness
- [ ] Submit sitemap to Google Search Console

## Brand Customization

All branding is centralized in `src/constants/brand.ts`. To rebrand, edit that single file and update `index.html` meta tags.
