export type ImportKind = "watched" | "ratings" | "likes" | "watchlist" | "diary" | "reviews";

export type ImportRow = {
  name: string;
  year?: string;
  /** "Date" column: when the row was logged on the other service. */
  date?: string;
  watchedDate?: string;
  rating?: string;
  rewatch?: string;
  review?: string;
};

/** Order matters: later files refine what earlier ones created. */
export const IMPORT_ORDER: ImportKind[] = ["watched", "ratings", "likes", "watchlist", "diary", "reviews"];

export const IMPORT_LABELS: Record<ImportKind, string> = {
  watched: "Watched films",
  ratings: "Ratings",
  likes: "Liked films",
  watchlist: "Watchlist",
  diary: "Diary",
  reviews: "Reviews",
};

/** Works out which export file this is from its name (e.g. "diary.csv", "likes/films.csv"). */
export function kindFromFilename(path: string): ImportKind | null {
  const p = path.toLowerCase();
  if (p.endsWith("likes/films.csv") || p.endsWith("likes-films.csv")) return "likes";
  const base = p.split("/").pop() ?? "";
  if (base === "watched.csv") return "watched";
  if (base === "ratings.csv") return "ratings";
  if (base === "watchlist.csv") return "watchlist";
  if (base === "diary.csv") return "diary";
  if (base === "reviews.csv") return "reviews";
  if (base === "films.csv") return "likes";
  return null;
}

/** Maps a CSV record with the export's column headings onto an ImportRow. */
export function toImportRow(r: Record<string, string>): ImportRow | null {
  const name = r["Name"]?.trim();
  if (!name) return null;
  return {
    name,
    year: r["Year"],
    date: r["Date"],
    watchedDate: r["Watched Date"],
    rating: r["Rating"],
    rewatch: r["Rewatch"],
    review: r["Review"] ? reviewHtmlToText(r["Review"]) : undefined,
  };
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/**
 * Letterboxd exports reviews as light HTML (<p>, <br>, <i>, <b>, <a>, <blockquote>).
 * Reviews here are plain text, so convert: paragraphs and line breaks become newlines,
 * quotes become “quoted” paragraphs, other tags are dropped and entities decoded.
 */
export function reviewHtmlToText(html: string): string {
  return html
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, q: string) => `\n\n“${q.trim()}”\n\n`)
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** profile.csv lists favourites as boxd.it links; look their titles up in the other export files. */
export function resolveFavorites(profileCsvRow: Record<string, string> | undefined, records: Record<string, string>[]) {
  const links = (profileCsvRow?.["Favorite Films"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const byUri = new Map<string, { name: string; year?: string }>();
  for (const r of records) {
    const uri = r["Letterboxd URI"]?.trim();
    if (uri && r["Name"] && !byUri.has(uri)) byUri.set(uri, { name: r["Name"], year: r["Year"] });
  }
  return links.map((l) => byUri.get(l)).filter((f): f is { name: string; year?: string } => Boolean(f)).slice(0, 4);
}
