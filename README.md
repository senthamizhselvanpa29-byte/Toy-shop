# 🧸 Toy Shop

A child-themed online toy shop for India — web app first, then Android + iOS apps.
See the full plan in [`docs/PLAN.md`](docs/PLAN.md).

## Project layout

```
apps/
  web/            Next.js web app (storefront + owner admin)
packages/
  shared/         Constants, types and helpers shared by web and mobile
  theme/          Child-theme colours, fonts and design tokens
docs/             Plan and decisions
```

## Getting started

Requires Node.js 20.9 or newer (see `.nvmrc`).

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # then fill in Supabase keys
npm run dev                                    # http://localhost:3000
```

### Supabase

1. Create a free project at [supabase.com](https://supabase.com) (region: Mumbai).
2. In **SQL Editor**, run each file in `supabase/migrations/` in order.
3. In **Authentication → Users**, add the owner's account (tick *Auto Confirm User*),
   then run `select public.set_shop_owner('owner@example.com');` in the SQL Editor.
4. Copy the **Project URL** and **publishable key** into `apps/web/.env.local`.

### Deploying to Vercel

Import the GitHub repo in Vercel, set **Root Directory** to `apps/web`, and add
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as environment
variables. The owner area lives at `/admin`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the web app locally |
| `npm run build` | Production build |
| `npm run lint` | Lint the web app |
| `npm run typecheck` | Type-check every package |
