import { NextResponse, type NextRequest } from "next/server";
import { bestMatch } from "@/lib/films";
import { yearOf } from "@/lib/tmdb";

/** Shows which TMDB film the importer would pick for a title + year. Read-only; useful for checking imports. */
export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title")?.trim() ?? "";
  const year = Number(req.nextUrl.searchParams.get("year")) || null;
  if (!title) return NextResponse.json({ error: "Pass ?title= and optionally &year=" }, { status: 400 });
  try {
    const hit = await bestMatch(title, year);
    return NextResponse.json({
      match: hit && { id: hit.id, title: hit.title, originalTitle: hit.original_title, year: yearOf(hit.release_date) },
    });
  } catch {
    return NextResponse.json({ error: "Film search is unavailable right now." }, { status: 502 });
  }
}
