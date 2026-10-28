/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { Avatar, displayName } from "@/components/avatar";
import { EmptyState, ReviewCard } from "@/components/cards";
import { FilmActions } from "@/components/film-actions";
import { RatingHistogram } from "@/components/histogram";
import { Poster } from "@/components/poster";
import { HeartIcon, Stars } from "@/components/stars";
import { db } from "@/lib/db";
import { filmStats } from "@/lib/film-stats";
import { ensureFilm } from "@/lib/films";
import { backdropUrl, filmHref, parseFilmParam, plural, runtimeText } from "@/lib/format";
import { entryInclude, followingIds } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

const loadFilm = cache(async (param: string) => {
  const id = parseFilmParam(param);
  return id ? ensureFilm(id) : null;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const film = await loadFilm((await params).id).catch(() => null);
  if (!film) return { title: "Film not found" };
  return { title: film.year ? `${film.title} (${film.year})` : film.title, description: film.overview ?? undefined };
}

export default async function FilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: param } = await params;
  const film = await loadFilm(param);
  if (!film) notFound();
  const canonical = filmHref(film);
  if (`/film/${param}` !== canonical) permanentRedirect(canonical);

  const viewer = await getViewer();
  const friendIds = viewer ? await followingIds(viewer.id) : [];
  const [stats, popular, recent, friends, status, watchlisted, myLists, myEntries] = await Promise.all([
    filmStats(film.id),
    db.logEntry.findMany({
      where: { filmId: film.id, review: { not: null } },
      include: entryInclude,
      orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
      take: 4,
    }),
    db.logEntry.findMany({
      where: { filmId: film.id, review: { not: null } },
      include: entryInclude,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    friendIds.length
      ? db.filmStatus.findMany({
          where: { filmId: film.id, userId: { in: friendIds }, watched: true },
          include: { user: { select: { id: true, username: true, displayName: true } } },
          orderBy: { updatedAt: "desc" },
          take: 24,
        })
      : [],
    viewer ? db.filmStatus.findUnique({ where: { userId_filmId: { userId: viewer.id, filmId: film.id } } }) : null,
    viewer ? db.watchlistItem.findUnique({ where: { userId_filmId: { userId: viewer.id, filmId: film.id } } }) : null,
    viewer
      ? db.list.findMany({
          where: { userId: viewer.id },
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, _count: { select: { items: true } }, items: { where: { filmId: film.id }, select: { filmId: true } } },
        })
      : [],
    viewer ? db.logEntry.count({ where: { userId: viewer.id, filmId: film.id } }) : 0,
  ]);
  const recentOnly = recent.filter((r) => !popular.some((p) => p.id === r.id));
  const cast = (film.cast as { name: string; character: string }[] | null) ?? [];
  const backdrop = backdropUrl(film.backdropPath);
  const filmHit = { id: film.id, title: film.title, year: film.year, posterPath: film.posterPath };

  return (
    <div>
      {backdrop && (
        <div className="relative h-48 overflow-hidden sm:h-72 md:h-96" aria-hidden>
          <img src={backdrop} alt="" className="h-full w-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-paper" />
        </div>
      )}
      <div className={`wrap grid gap-8 md:grid-cols-[13rem_1fr] lg:grid-cols-[13rem_1fr_17rem] ${backdrop ? "-mt-24 sm:-mt-32 relative" : "pt-10"}`}>
        <div className="order-1 mx-auto w-40 sm:w-48 md:order-none md:col-start-1 md:row-span-3 md:row-start-1 md:mx-0 md:w-full">
          <Poster film={film} link={false} priority />
          <dl className="mt-4 grid grid-cols-3 text-center text-xs text-muted">
            <div>
              <dt className="sr-only">Members who watched</dt>
              <dd className="font-semibold text-ink">{stats.watched.toLocaleString("en-GB")}</dd>
              <dd>watched</dd>
            </div>
            <div>
              <dt className="sr-only">Lists</dt>
              <dd className="font-semibold text-ink">{stats.lists.toLocaleString("en-GB")}</dd>
              <dd>lists</dd>
            </div>
            <div>
              <dt className="sr-only">Likes</dt>
              <dd className="font-semibold text-ink">{stats.liked.toLocaleString("en-GB")}</dd>
              <dd>likes</dd>
            </div>
          </dl>
        </div>

        <header className={`order-2 min-w-0 md:order-none md:col-start-2 md:row-start-1 ${backdrop ? "md:pt-24 lg:pt-28" : ""}`}>
          <h1 className="display text-4xl font-medium sm:text-5xl">{film.title}</h1>
          <p className="mt-2 text-muted">
            {film.year && <span className="mr-3 text-ink">{film.year}</span>}
            {film.directors.length > 0 && (
              <span className="mr-3">
                Directed by <span className="font-semibold text-ink">{film.directors.join(", ")}</span>
              </span>
            )}
            {film.runtime && <span>{runtimeText(film.runtime)}</span>}
          </p>
          {film.originalTitle && <p className="mt-1 text-sm italic text-muted">{film.originalTitle}</p>}
        </header>

        <div className="order-4 min-w-0 md:order-none md:col-start-2 md:row-start-3 lg:row-span-2 lg:row-start-2">
          {film.tagline && <p className="display text-lg italic">{film.tagline}</p>}
          {film.overview && <p className="mt-3 max-w-[65ch]">{film.overview}</p>}
          {film.genres.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {film.genres.map((g) => (
                <li key={g} className="rounded-full border border-rule px-3 py-0.5 text-muted">
                  {g}
                </li>
              ))}
            </ul>
          )}
          {cast.length > 0 && (
            <section className="mt-8">
              <h2 className="section-title text-xl">Cast</h2>
              <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                {cast.map((c) => (
                  <li key={c.name + c.character}>
                    <span className="font-semibold">{c.name}</span>
                    {c.character && <span className="text-muted"> as {c.character}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {friends.length > 0 && (
            <section className="mt-10">
              <h2 className="section-title text-xl">Friends who watched</h2>
              <ul className="flex flex-wrap gap-4">
                {friends.map((f) => (
                  <li key={f.userId} className="flex flex-col items-center gap-1 text-xs">
                    <Avatar user={f.user} size={40} />
                    <span className="flex h-4 items-center gap-1">
                      <Stars rating={f.rating} />
                      {f.liked && <HeartIcon className="h-3 w-3 text-heart" />}
                    </span>
                    <span className="sr-only">{displayName(f.user)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="section-title text-xl">
              Popular reviews
              {stats.entries > 0 && <Link href={`${canonical}/reviews`}>All reviews</Link>}
            </h2>
            {popular.length ? (
              popular.map((e) => <ReviewCard key={e.id} entry={e} showFilm={false} />)
            ) : (
              <EmptyState title="No reviews yet">Be the first to write about {film.title}.</EmptyState>
            )}
          </section>
          {recentOnly.length > 0 && (
            <section className="mt-10">
              <h2 className="section-title text-xl">Recent reviews</h2>
              {recentOnly.map((e) => (
                <ReviewCard key={e.id} entry={e} showFilm={false} />
              ))}
            </section>
          )}
        </div>

        <aside className={`order-3 grid content-start gap-6 md:order-none md:col-start-2 md:row-start-2 md:max-w-sm lg:col-start-3 lg:row-span-3 lg:row-start-1 lg:max-w-none ${backdrop ? "lg:pt-24" : ""}`}>
          {viewer ? (
            <FilmActions
              film={filmHit}
              initial={{
                watched: status?.watched ?? false,
                liked: status?.liked ?? false,
                rating: status?.rating ?? 0,
                watchlisted: Boolean(watchlisted),
              }}
              hasDiaryEntries={myEntries > 0}
              lists={myLists.map((l) => ({ id: l.id, title: l.title, count: l._count.items, hasFilm: l.items.length > 0 }))}
            />
          ) : (
            <div className="rounded-xl border border-rule bg-surface p-4 text-center">
              <p className="mb-3 text-sm text-muted">Sign in to log, rate or review this film.</p>
              <Link href={`/login?next=${encodeURIComponent(canonical)}`} className="btn btn-primary w-full">
                Sign in
              </Link>
            </div>
          )}
          <div className="rounded-xl border border-rule bg-surface p-4">
            <RatingHistogram histogram={stats.histogram} average={stats.average} />
            {stats.ratingsCount === 0 && <p className="mt-2 text-xs text-muted">No ratings yet.</p>}
          </div>
          <p className="text-xs text-muted">
            {plural(stats.entries, "diary entry", "diary entries")} by members.{" "}
            <a href={`https://www.themoviedb.org/movie/${film.id}`} className="link" rel="noopener" target="_blank">
              View on TMDB
            </a>
          </p>
        </aside>
      </div>
    </div>
  );
}
