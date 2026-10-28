# Reelbook

An open-source social film diary. Log the films you watch, rate them on a half-star scale, write reviews, keep a watchlist, make lists and follow friends. Bring your history over from a Letterboxd export.

Built with Next.js, PostgreSQL (via Prisma) and film data from [TMDB](https://www.themoviedb.org). Runs comfortably on free tiers (Vercel + Neon).

> **Name:** "Reelbook" is a working title. Change it in one place: set `NEXT_PUBLIC_SITE_NAME`, or edit `src/lib/site.ts`. Pick a name that is your own; avoid names or branding that could be confused with other film services.

## Features

- **Diary** – log each viewing with a date, half-star rating, like, rewatch flag and an optional review (with a spoiler guard). Diary rows are grouped by month and filterable by year.
- **Film pages** – poster, backdrop, director, cast, genres, a ratings histogram, members' reviews (most liked / newest / from people you follow), and quick actions for watched, like, rating and watchlist.
- **Lists** – ranked or unranked, public or private, with per-film notes and reordering.
- **Social** – follow members, an activity feed of the people you follow, likes on reviews and lists, comments on reviews.
- **Profiles** – four favourite films, recent activity, watched films, reviews, watchlist, lists and likes.
- **Stats** – a year-in-review page: films by month and weekday, ratings spread, top genres and directors, hours watched, highest rated.
- **Letterboxd import** – upload the export `.zip` (or its CSVs). Imports watched films, ratings, likes, watchlist, diary and reviews. Re-running it doesn't create duplicates.
- **Accounts** – username/email + password sign-in (Auth.js).

## Quick start (local)

Requirements: Node 20.9+, PostgreSQL 14+.

```bash
git clone https://github.com/Stillbadatlinux/Openboxd.git
cd Openboxd
npm install
cp .env.example .env        # then fill it in (see below)
npx prisma migrate dev      # creates the tables
npm run dev                 # http://localhost:3000
```

Fill in `.env`:

| Variable | What it's for |
| --- | --- |
| `DATABASE_URL` | Postgres connection string the app uses. |
| `DIRECT_URL` | Non-pooled connection string used by migrations. Locally, same as `DATABASE_URL`. |
| `AUTH_SECRET` | Signs session cookies. Generate with `npx auth secret` or `openssl rand -base64 32`. |
| `TMDB_API_KEY` | Free from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). Either the v3 API key or the v4 Read Access Token works. |
| `NEXT_PUBLIC_SITE_NAME` | Optional. The site's display name. |

### Developing without a TMDB key

A small mock server with a dozen invented films is included:

```bash
npm run mock:tmdb   # in one terminal
# in .env:
# TMDB_API_KEY="mock"
# TMDB_API_BASE="http://127.0.0.1:4010/3"
npm run dev         # in another
```

## Deploy for free (Vercel + Neon)

1. **Push this repo to GitHub** (you're probably already there).
2. **Create a database** at [neon.tech](https://neon.tech) (free tier). Copy two connection strings: the *pooled* one (host contains `-pooler`) and the *direct* one.
3. **Import the repo on [vercel.com/new](https://vercel.com/new).** Framework preset: Next.js. Before the first deploy, add these environment variables:
   - `DATABASE_URL` = Neon pooled connection string
   - `DIRECT_URL` = Neon direct connection string
   - `AUTH_SECRET` = a random secret (`openssl rand -base64 32`)
   - `TMDB_API_KEY` = your TMDB key
4. **Deploy.** The `vercel-build` script runs `prisma migrate deploy` before building, so the tables are created on the first deploy and kept up to date on later ones.

Supabase works the same way: use its "Transaction pooler" string for `DATABASE_URL` and the direct string for `DIRECT_URL`.

### Self-hosting elsewhere

Any Node host works: set the same environment variables, then run `npx prisma migrate deploy && npm run build && npm start`.

## Before you launch publicly

- **TMDB attribution.** TMDB's terms require the notice in the footer and About page (already included) *and* one of their [approved logos](https://www.themoviedb.org/about/logos-attribution) in your About or Credits page. Download one, save it as `public/tmdb-logo.svg`, and add it to `src/app/about/page.tsx`. The free TMDB API is for non-commercial use; a commercial site needs a TMDB licence.
- **Email verification, password reset and sign-in rate limiting** aren't built yet (see the roadmap). Until they are, keep an eye on sign-ups.
- **Back up your database.** Neon and Supabase both offer point-in-time restore.

## Project layout

```
prisma/schema.prisma        data model (users, films, diary entries, lists, follows, likes, comments)
src/app/                    routes (App Router). Server actions live in src/app/actions/
src/components/             UI components
src/lib/tmdb.ts             TMDB client
src/lib/films.ts            caches TMDB film metadata in Postgres
src/auth.ts                 Auth.js configuration
scripts/mock-tmdb.mjs       offline TMDB stand-in
```

Design notes: film metadata is cached in the `Film` table (refreshed monthly) so pages don't depend on TMDB for every view. Ratings are stored as integers 1–10 (half stars). A member's current rating/like/watched state for a film (`FilmStatus`) is separate from their diary entries (`LogEntry`), so you can rate a film without logging a viewing, and log many viewings of one film.

## Roadmap

Good first contributions:

- Password reset and email verification
- Rate limiting for sign-in and sign-up
- Sign in with GitHub / Google (Auth.js providers + Prisma adapter)
- Avatar uploads
- Tags on diary entries, and importing lists and tags from Letterboxd
- Film search filters (genre, decade), people pages (directors, cast)
- Blocking/muting and reporting
- Translations

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and pull requests are welcome.

## Licence

[MIT](LICENSE). Film data and images © TMDB and their respective owners. This product uses the TMDB API but is not endorsed or certified by TMDB. Not affiliated with Letterboxd.
