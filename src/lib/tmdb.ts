import "server-only";

// Thin client for The Movie Database (TMDB) API.
// Accepts either a v3 API key or a v4 "API Read Access Token" in TMDB_API_KEY.
// TMDB_API_BASE can point at a mock server for tests.

const BASE = process.env.TMDB_API_BASE || "https://api.themoviedb.org/3";

export type TmdbMovieSummary = {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
};

export type TmdbMovieDetails = TmdbMovieSummary & {
  runtime: number | null;
  tagline: string | null;
  genres: { id: number; name: string }[];
  credits?: {
    cast: { name: string; character: string; order: number }[];
    crew: { name: string; job: string }[];
  };
};

type Paged<T> = { page: number; total_pages: number; total_results: number; results: T[] };

export class TmdbError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export function tmdbConfigured() {
  return Boolean(process.env.TMDB_API_KEY);
}

async function request<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  revalidate = 60 * 60,
): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new TmdbError("TMDB_API_KEY is not set");

  const url = new URL(BASE + path);
  const headers: Record<string, string> = { accept: "application/json" };
  // v4 tokens are JWTs; v3 keys are 32 hex characters.
  if (key.startsWith("eyJ")) headers.authorization = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, { headers, next: { revalidate } });
  if (!res.ok) throw new TmdbError(`TMDB ${path} responded ${res.status}`, res.status);
  return res.json() as Promise<T>;
}

export function searchMovies(query: string, page = 1, year?: number) {
  return request<Paged<TmdbMovieSummary>>("/search/movie", {
    query,
    page,
    include_adult: "false",
    primary_release_year: year,
  });
}

export function trendingMovies(page = 1) {
  return request<Paged<TmdbMovieSummary>>("/trending/movie/week", { page });
}

export function popularMovies(page = 1) {
  return request<Paged<TmdbMovieSummary>>("/movie/popular", { page });
}

export function topRatedMovies(page = 1) {
  return request<Paged<TmdbMovieSummary>>("/movie/top_rated", { page }, 60 * 60 * 24);
}

export function nowPlayingMovies(page = 1) {
  return request<Paged<TmdbMovieSummary>>("/movie/now_playing", { page });
}

export function movieDetails(id: number) {
  return request<TmdbMovieDetails>(`/movie/${id}`, { append_to_response: "credits" }, 60 * 60 * 24);
}

export function yearOf(date?: string | null) {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) && y > 1800 ? y : null;
}

/** Runs a TMDB call, returning null instead of throwing (for optional page sections). */
export async function tryTmdb<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error("[tmdb]", (err as Error).message);
    return null;
  }
}

export function summaryToPoster(m: TmdbMovieSummary) {
  return { id: m.id, title: m.title, year: yearOf(m.release_date), posterPath: m.poster_path };
}
