// Helpers safe to use in both server and client components.

const IMG = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null | undefined, size: "w92" | "w185" | "w342" | "w500" = "w342") {
  return path ? `${IMG}/${size}${path}` : null;
}

export function backdropUrl(path: string | null | undefined, size: "w780" | "w1280" = "w1280") {
  return path ? `${IMG}/${size}${path}` : null;
}

export function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function filmHref(film: { id: number; title: string }) {
  const slug = slugify(film.title);
  return slug ? `/film/${film.id}-${slug}` : `/film/${film.id}`;
}

/** Parses "603-the-matrix" or "603" into 603. */
export function parseFilmParam(param: string) {
  const id = Number.parseInt(param, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Ratings are stored as half-stars 1..10. */
export function starsText(rating: number | null | undefined) {
  if (!rating) return "";
  return "★".repeat(Math.floor(rating / 2)) + (rating % 2 ? "½" : "");
}

export function ratingLabel(rating: number | null | undefined) {
  if (!rating) return "Not rated";
  const n = rating / 2;
  return `${n} star${n === 1 ? "" : "s"}`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return dateFmt.format(new Date(d));
}

export function formatMonth(d: Date) {
  return monthFmt.format(d);
}

export function timeAgo(d: Date | string) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function runtimeText(min: number | null | undefined) {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function plural(n: number, one: string, many = one + "s") {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;
}

/** Today's date as YYYY-MM-DD, for date inputs. */
export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
