# Contributing

Thanks for helping out. Small, focused pull requests are easiest to review.

## Setting up

Follow the Quick start in the README. If you don't have a TMDB key, use the mock server (`npm run mock:tmdb`).

## Before opening a pull request

```bash
npm run lint
npm run typecheck
npm run build
```

CI runs the same three checks against a fresh Postgres database.

## Changing the database

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name short-description`.
3. Commit the new folder under `prisma/migrations/` along with your code.

Never edit a migration that's already on `main`; add a new one instead.

## Conventions

- Server-side reads happen in server components; writes go through server actions in `src/app/actions/`. Every action checks the signed-in member itself — never trust IDs from the client to imply ownership.
- Ratings are integers 1–10 (half stars). Use `starsText` / `ratingLabel` from `src/lib/format.ts` to display them.
- Colours come from the CSS tokens in `src/app/globals.css` (`bg-paper`, `text-muted`, `text-usher`…), which have light and dark values. Don't hard-code hex colours in components.
- Interface copy: sentence case, plain verbs, and say what a button does ("Save list", not "Submit").
- Film data comes from TMDB. Keep the attribution in the footer and About page.

## Reporting bugs

Open an issue with what you did, what you expected, and what happened instead. Screenshots help.
