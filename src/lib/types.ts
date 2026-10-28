/** A film search result, as returned by /api/search. */
export type SearchHit = { id: number; title: string; year: number | null; posterPath: string | null };
