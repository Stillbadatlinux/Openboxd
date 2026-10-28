import { NextResponse, type NextRequest } from "next/server";
import { searchMovies, yearOf } from "@/lib/tmdb";

import type { SearchHit } from "@/lib/types";

/** Film search for the "log a film", list editor and favourites pickers. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const data = await searchMovies(q);
    const results: SearchHit[] = data.results.slice(0, 10).map((m) => ({
      id: m.id,
      title: m.title,
      year: yearOf(m.release_date),
      posterPath: m.poster_path,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Film search is unavailable right now." }, { status: 502 });
  }
}
