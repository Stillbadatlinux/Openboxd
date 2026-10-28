import "server-only";
import type { Film, Prisma } from "@prisma/client";
import { db } from "./db";
import { scoreCandidate } from "./match";
import { movieDetails, searchMovies, TmdbError, yearOf, type TmdbMovieDetails, type TmdbMovieSummary } from "./tmdb";

const STALE_AFTER_MS = 1000 * 60 * 60 * 24 * 30; // refresh cached metadata monthly

function toFilmData(m: TmdbMovieDetails): Omit<Prisma.FilmCreateInput, "id"> {
  const crew = m.credits?.crew ?? [];
  const cast = (m.credits?.cast ?? [])
    .sort((a, b) => a.order - b.order)
    .slice(0, 16)
    .map((c) => ({ name: c.name, character: c.character }));
  return {
    title: m.title,
    originalTitle: m.original_title && m.original_title !== m.title ? m.original_title : null,
    releaseDate: m.release_date ? new Date(m.release_date) : null,
    year: yearOf(m.release_date),
    overview: m.overview || null,
    tagline: m.tagline || null,
    runtime: m.runtime || null,
    posterPath: m.poster_path,
    backdropPath: m.backdrop_path ?? null,
    genres: m.genres.map((g) => g.name),
    directors: [...new Set(crew.filter((c) => c.job === "Director").map((c) => c.name))],
    cast,
    fetchedAt: new Date(),
  };
}

/**
 * Returns the film from our database, fetching or refreshing it from TMDB when needed.
 * Returns null if the film doesn't exist on TMDB and we have no cached copy.
 */
export async function ensureFilm(id: number): Promise<Film | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const cached = await db.film.findUnique({ where: { id } });
  if (cached && Date.now() - cached.fetchedAt.getTime() < STALE_AFTER_MS) return cached;

  try {
    const details = await movieDetails(id);
    const data = toFilmData(details);
    return await db.film.upsert({ where: { id }, create: { id, ...data }, update: data });
  } catch (err) {
    if (cached) return cached; // serve stale data if TMDB is unreachable
    if (err instanceof TmdbError && err.status === 404) return null;
    throw err;
  }
}

/** The best TMDB search result for a title + year, or null if nothing is a convincing match. */
export async function bestMatch(title: string, year?: number | null): Promise<TmdbMovieSummary | null> {
  const clean = title.trim();
  if (!clean) return null;

  // Search with the year and without it, then pick the best-scoring result from both.
  const [withYear, anyYear] = await Promise.all([
    year ? searchMovies(clean, 1, year).then((r) => r.results) : Promise.resolve([]),
    searchMovies(clean).then((r) => r.results),
  ]);
  const seen = new Set<number>();
  const candidates = [...withYear, ...anyYear].filter((r) => !seen.has(r.id) && seen.add(r.id));
  if (!candidates.length) return null;

  const ranked = candidates
    .map((r, order) => ({ r, order, ...scoreCandidate({ title: clean, year }, r) }))
    .sort((a, b) => b.score - a.score || a.order - b.order);
  const best = ranked[0];

  // Without any title agreement, only trust a same-year hit; otherwise report it as unmatched.
  if (!best.exact && !best.partial && best.gap !== 0) return null;
  return best.r;
}

/** Finds the best TMDB match for a title + year and caches it (used by the Letterboxd import). */
export async function matchFilm(title: string, year?: number | null): Promise<Film | null> {
  const hit = await bestMatch(title, year);
  return hit ? ensureFilm(hit.id) : null;
}
