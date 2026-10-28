/* eslint-disable @next/next/no-img-element -- TMDB serves pre-sized images; skipping the optimiser keeps free-tier hosting within limits. */
import Link from "next/link";
import { filmHref, posterUrl } from "@/lib/format";

type PosterFilm = { id: number; title: string; year?: number | null; posterPath: string | null };

const WIDTHS = { xs: "w-12", sm: "w-20", md: "w-28 sm:w-32", lg: "w-40 sm:w-56", fill: "w-full" } as const;

export function Poster({
  film,
  size = "fill",
  link = true,
  priority = false,
}: {
  film: PosterFilm;
  size?: keyof typeof WIDTHS;
  link?: boolean;
  priority?: boolean;
}) {
  const src = posterUrl(film.posterPath, size === "lg" ? "w500" : size === "xs" ? "w92" : "w342");
  const label = film.year ? `${film.title} (${film.year})` : film.title;
  const art = (
    <span
      className={`${WIDTHS[size]} @container relative block aspect-[2/3] overflow-hidden rounded-[4px] bg-rule ring-1 ring-black/10 dark:ring-white/10`}
    >
      {src ? (
        <img
          src={src}
          alt={label}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="display absolute inset-0 hidden items-center justify-center p-2 text-center text-sm text-muted @min-[4.5rem]:flex">
          {film.title}
        </span>
      )}
    </span>
  );
  if (!link) return art;
  return (
    <Link href={filmHref(film)} title={label} className="block rounded-[4px] transition-transform hover:-translate-y-0.5">
      {art}
    </Link>
  );
}

export function PosterGrid({
  films,
  dense = false,
  footer,
}: {
  films: PosterFilm[];
  dense?: boolean;
  footer?: (film: PosterFilm, index: number) => React.ReactNode;
}) {
  return (
    <ul
      className={
        dense
          ? "grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8"
          : "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6"
      }
    >
      {films.map((f, i) => (
        <li key={f.id}>
          <Poster film={f} />
          {footer?.(f, i)}
        </li>
      ))}
    </ul>
  );
}
