import "server-only";
import type { Film, Prisma } from "@prisma/client";
import { db } from "./db";
import { movieDetails, searchMovies, TmdbError, yearOf, type TmdbMovieDetails } from "./tmdb";

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

/** Finds the best TMDB match for a title + year (used by the Letterboxd import). */
export async function matchFilm(title: string, year?: number | null): Promise<Film | null> {
  const clean = title.trim();
  if (!clean) return null;
  let results = (await searchMovies(clean, 1, year ?? undefined)).results;
  if (!results.length && year) results = (await searchMovies(clean)).results;
  if (!results.length) return null;

  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const target = norm(clean);
  const best =
    results.find((r) => norm(r.title) === target && (!year || yearOf(r.release_date) === year)) ??
    results.find((r) => !year || Math.abs((yearOf(r.release_date) ?? 0) - year) <= 1) ??
    results[0];
  return ensureFilm(best.id);
}
