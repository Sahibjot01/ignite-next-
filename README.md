# Ignite

A personal PlayStation companion app — tracks your PS4/PS5 wishlist, imports your real PSN library and playtime, and (in progress) watches for free/discounted games you'd actually want so you stop missing them.

## Why

Sony's own PS App wishlist notifications are widely reported as unreliable — alerts that arrive late, only for some titles, or not at all. It's a common story: a game you wanted goes free or drops in price, and you only hear about it by chance — social media, a friend, anywhere but PlayStation's own tooling. Ignite is meant to actually solve that: watch PS Plus and PS Store pricing, cross-reference against what you've wishlisted and played, and surface the "you'd want this" moments Sony's app keeps missing.

This isn't a generic multi-platform deals tracker — it's scoped tightly to PlayStation, built around a problem I've actually had.

## What it does

**Built:**
- PS4/PS5-only game browsing and search (RAWG-backed)
- PSN account linking (NPSSO-based token exchange, encrypted refresh token storage)
- Library + playtime import from your real PSN account
- Wishlist with price history charts and price-drop alerts
- In-app notifications

**In progress:**
- "For You" recommendations based on the genres/tags of what you've actually played, not just generic ratings
- Free/discounted-game monitor — Essential monthly rotation, Extra/Premium catalog changes, and "leaving soon" alerts, matched against your wishlist, with a direct link to the claim page instead of hunting through PS5 menus
- Swapping price tracking over to a dedicated PlayStation Store price source

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui
- [Clerk](https://clerk.com) for auth
- [Supabase](https://supabase.com) (Postgres + row-level security) for data
- [psn-api](https://github.com/achievements-app/psn-api) for PSN integration
- [RAWG](https://rawg.io/apidocs) for game metadata
- [Motion](https://motion.dev) for animation, [Recharts](https://recharts.org) for price charts

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need:
- A Supabase project with the migrations in `supabase/migrations/` applied
- A Clerk application
- A RAWG API key

Then fill in `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RAWG_API_KEY=
CRON_SECRET=
PSN_TOKEN_ENCRYPTION_KEY=
```

PSN linking itself doesn't need a repo-level credential — each user links their own account at runtime with a one-time NPSSO token (see the in-app Settings page). `PSN_TOKEN_ENCRYPTION_KEY` is the server-side key used to encrypt those per-user refresh tokens at rest.

---

Not affiliated with Sony or PlayStation. Personal project, not a commercial product.
