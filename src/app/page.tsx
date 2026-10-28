import Link from "next/link";
import { ActivityFeed } from "@/components/activity";
import { EmptyState, ListGrid, ReviewCard } from "@/components/cards";
import { Pagination, pageParam } from "@/components/pagination";
import { Poster, PosterGrid } from "@/components/poster";
import { Stars } from "@/components/stars";
import { db } from "@/lib/db";
import { getFeed, popularLists, popularReviews } from "@/lib/feed";
import { entryInclude, followingIds, type EntryWithMeta } from "@/lib/queries";
import { SITE_NAME } from "@/lib/site";
import { summaryToPoster, trendingMovies, tryTmdb } from "@/lib/tmdb";
import { getViewer } from "@/lib/viewer";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const viewer = await getViewer();
  const page = pageParam((await searchParams).page);
  const trending = (await tryTmdb(() => trendingMovies()))?.results.slice(0, 12).map(summaryToPoster) ?? [];

  if (!viewer) return <SignedOutHome trending={trending} />;

  const following = await followingIds(viewer.id);
  const [feed, reviews] = await Promise.all([
    following.length ? getFeed(following, page) : getFeed(null, page),
    popularReviews(7, 4),
  ]);

  return (
    <div className="wrap grid gap-12 py-10 lg:grid-cols-[1fr_20rem]">
      <section>
        <h1 className="section-title">
          {following.length ? "From people you follow" : "Latest from members"}
        </h1>
        {!following.length && (
          <p className="mb-4 rounded-lg bg-surface px-4 py-3 text-sm text-muted">
            Follow members to fill this page with their diaries and reviews.{" "}
            <Link href="/members" className="link">
              Find people to follow
            </Link>
          </p>
        )}
        {feed.items.length ? (
          <>
            <ActivityFeed items={feed.items} />
            <Pagination page={page} hasMore={feed.hasMore} href={(p) => `/?page=${p}`} prevLabel="Newer" nextLabel="Older" />
          </>
        ) : (
          <EmptyState title="Nothing logged yet">
            When members log films, they&apos;ll show up here. Start with yours: use Log a film at the top of the page.
          </EmptyState>
        )}
      </section>
      <aside className="grid content-start gap-10">
        {trending.length > 0 && (
          <section>
            <h2 className="section-title">
              Trending this week <Link href="/films">More</Link>
            </h2>
            <ul className="grid grid-cols-4 gap-2 lg:grid-cols-3">
              {trending.slice(0, 12).map((f) => (
                <li key={f.id}>
                  <Poster film={f} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {reviews.length > 0 && (
          <section>
            <h2 className="section-title">Popular reviews</h2>
            {reviews.map((e) => (
              <ReviewCard key={e.id} entry={e} />
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}

async function SignedOutHome({ trending }: { trending: { id: number; title: string; year: number | null; posterPath: string | null }[] }) {
  const [recent, reviews, lists] = await Promise.all([
    db.logEntry.findMany({ where: { watchedOn: { not: null } }, include: entryInclude, orderBy: { createdAt: "desc" }, take: 4 }),
    popularReviews(30, 4),
    popularLists(3),
  ]);

  return (
    <>
      <section className="border-b border-rule">
        <div className="wrap grid items-center gap-10 py-14 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div>
            <h1 className="display reveal text-5xl font-medium sm:text-6xl lg:text-7xl">
              Every film you watch, kept.
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg text-muted">
              {SITE_NAME} is a diary for film lovers. Log what you watch and when, rate it, write about it, make lists
              and see what your friends are watching. It&apos;s open source and free to host yourself.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary px-5 py-2.5 text-base">
                Create an account
              </Link>
              <Link href="/films" className="btn btn-quiet px-5 py-2.5 text-base">
                Browse films
              </Link>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-muted">{recent.length ? "Just logged by members" : "What a diary looks like"}</p>
            <ul className="grid gap-3">
              {(recent.length ? recent.map((e) => stubFromEntry(e)) : SAMPLE_STUBS).map((s) => (
                <li key={s.key} className="stub">
                  <div className="stub-date">
                    <span className="display text-3xl font-semibold leading-none">{s.day}</span>
                    <span className="mt-1 text-xs font-semibold">{s.month}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 pl-4">
                    {s.film && (
                      <div className="w-9 shrink-0">
                        <Poster film={s.film} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="display truncate text-lg">{s.title}</p>
                      <p className="flex items-center gap-2 text-sm text-muted">
                        <Stars rating={s.rating} />
                        <span>{s.who}</span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="wrap grid gap-14 py-12">
        {trending.length > 0 && (
          <section>
            <h2 className="section-title">
              Trending this week <Link href="/films">Browse films</Link>
            </h2>
            <PosterGrid films={trending} />
          </section>
        )}
        {reviews.length > 0 && (
          <section>
            <h2 className="section-title">Popular reviews</h2>
            <div className="grid gap-x-10 md:grid-cols-2">
              {reviews.map((e) => (
                <ReviewCard key={e.id} entry={e} />
              ))}
            </div>
          </section>
        )}
        {lists.length > 0 && (
          <section>
            <h2 className="section-title">
              Popular lists <Link href="/lists">All lists</Link>
            </h2>
            <ListGrid lists={lists} />
          </section>
        )}
      </div>
    </>
  );
}

type Stub = {
  key: string;
  day: number;
  month: string;
  title: string;
  rating: number | null;
  who: string;
  film?: { id: number; title: string; posterPath: string | null };
};

function stubFromEntry(e: EntryWithMeta): Stub {
  const d = e.watchedOn ?? e.createdAt;
  return {
    key: e.id,
    day: d.getUTCDate(),
    month: d.toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }),
    title: e.film.title,
    rating: e.rating,
    who: e.user.displayName || e.user.username,
    film: e.film,
  };
}

// Shown on a brand-new install before anyone has logged anything.
const SAMPLE_STUBS: Stub[] = [
  { key: "a", day: 14, month: "Feb 2026", title: "A Friday night double bill", rating: 9, who: "you" },
  { key: "b", day: 3, month: "Mar 2026", title: "That classic you finally saw", rating: 8, who: "you" },
  { key: "c", day: 21, month: "Mar 2026", title: "A rewatch with friends", rating: 7, who: "you" },
];
