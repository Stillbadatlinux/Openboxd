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
    review: r["Review"],
  };
}
