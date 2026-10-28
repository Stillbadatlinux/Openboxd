import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, ReviewCard } from "@/components/cards";
import { Pagination, pageParam } from "@/components/pagination";
import { Poster } from "@/components/poster";
import { db } from "@/lib/db";
import { ensureFilm } from "@/lib/films";
import { filmHref, parseFilmParam } from "@/lib/format";
import { entryInclude, followingIds } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

const PER_PAGE = 20;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = parseFilmParam((await params).id);
  const film = id ? await ensureFilm(id).catch(() => null) : null;
  return { title: film ? `Reviews of ${film.title}` : "Reviews" };
}

export default async function FilmReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const id = parseFilmParam((await params).id);
  const film = id ? await ensureFilm(id) : null;
  if (!film) notFound();
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const viewer = await getViewer();
  const sort = sp.sort === "recent" || (sp.sort === "friends" && viewer) ? sp.sort : "popular";

  const where = {
    filmId: film.id,
    review: { not: null },
    ...(sort === "friends" && viewer ? { userId: { in: await followingIds(viewer.id) } } : {}),
  };
  const rows = await db.logEntry.findMany({
    where,
    include: entryInclude,
    orderBy: sort === "popular" ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }] : { createdAt: "desc" },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE + 1,
  });
  const base = `${filmHref(film)}/reviews`;
  const sorts = [
    ["popular", "Most liked"],
    ["recent", "Newest"],
    ...(viewer ? [["friends", "From people you follow"]] : []),
  ];

  return (
    <div className="wrap max-w-4xl py-10">
      <div className="mb-6 flex items-center gap-4">
        <div className="w-14 shrink-0">
          <Poster film={film} />
        </div>
        <div>
          <p className="text-sm text-muted">Reviews of</p>
          <h1 className="display text-3xl">
            <Link href={filmHref(film)} className="hover:text-usher">
              {film.title}
            </Link>{" "}
            {film.year && <span className="text-xl text-muted">{film.year}</span>}
          </h1>
        </div>
      </div>
      <nav className="mb-4 flex flex-wrap gap-2 text-sm" aria-label="Sort reviews">
        {sorts.map(([key, label]) => (
          <Link
            key={key}
            href={key === "popular" ? base : `${base}?sort=${key}`}
            aria-current={key === sort ? "page" : undefined}
            className={`rounded-full border px-3 py-1 ${key === sort ? "border-ink font-semibold" : "border-rule text-muted hover:text-ink"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        rows.slice(0, PER_PAGE).map((e) => <ReviewCard key={e.id} entry={e} showFilm={false} />)
      ) : (
        <EmptyState title={sort === "friends" ? "No one you follow has reviewed this yet" : "No reviews yet"} />
      )}
      <Pagination
        page={page}
        hasMore={rows.length > PER_PAGE}
        href={(p) => `${base}?${new URLSearchParams({ ...(sort !== "popular" ? { sort } : {}), page: String(p) })}`}
      />
    </div>
  );
}
