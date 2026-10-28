import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/cards";
import { Pagination, pageParam } from "@/components/pagination";
import { PosterGrid } from "@/components/poster";
import {
  nowPlayingMovies,
  popularMovies,
  searchMovies,
  summaryToPoster,
  tmdbConfigured,
  topRatedMovies,
  trendingMovies,
  tryTmdb,
} from "@/lib/tmdb";

export const metadata: Metadata = { title: "Films" };

const TABS = {
  trending: { label: "Trending", fetch: trendingMovies },
  popular: { label: "Popular", fetch: popularMovies },
  "now-playing": { label: "In cinemas", fetch: nowPlayingMovies },
  "top-rated": { label: "Top rated", fetch: topRatedMovies },
} as const;

type Tab = keyof typeof TABS;

export default async function FilmsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = pageParam(sp.page);
  const tab: Tab = sp.tab && sp.tab in TABS ? (sp.tab as Tab) : "trending";

  const data = await tryTmdb(() => (q ? searchMovies(q, page) : TABS[tab].fetch(page)));
  const films = data?.results.map(summaryToPoster) ?? [];
  const hasMore = data ? data.page < Math.min(data.total_pages, 500) : false;
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    else if (tab !== "trending") u.set("tab", tab);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/films?${s}` : "/films";
  };

  return (
    <div className="wrap py-10">
      <form action="/films" role="search" className="mb-8 flex max-w-xl gap-2">
        <input type="search" name="q" defaultValue={q} placeholder="Search by title" aria-label="Search by title" className="field" />
        <button className="btn btn-primary">Search</button>
      </form>

      {q ? (
        <h1 className="section-title">
          <span>
            Results for “{q}”
          </span>
          {data && <span className="text-sm font-normal text-muted">{data.total_results.toLocaleString("en-GB")} films</span>}
        </h1>
      ) : (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-rule">
          <h1 className="display pb-2 text-3xl">Films</h1>
          <nav className="flex gap-1 text-sm" aria-label="Browse">
            {(Object.keys(TABS) as Tab[]).map((t) => (
              <Link
                key={t}
                href={t === "trending" ? "/films" : `/films?tab=${t}`}
                aria-current={t === tab ? "page" : undefined}
                className={`-mb-px border-b-2 px-3 py-2 font-semibold ${t === tab ? "border-velvet text-ink dark:border-brass" : "border-transparent text-muted hover:text-ink"}`}
              >
                {TABS[t].label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {!data ? (
        <EmptyState title="Film data is unavailable">
          {tmdbConfigured()
            ? "TMDB didn't respond. Try again in a minute."
            : "This server has no TMDB API key yet. Add TMDB_API_KEY to the environment (see the README) and restart."}
        </EmptyState>
      ) : films.length ? (
        <>
          <PosterGrid films={films} footer={(f) => <p className="mt-1 truncate text-xs text-muted">{f.year ?? "—"}</p>} />
          <Pagination page={page} hasMore={hasMore} href={href} />
        </>
      ) : (
        <EmptyState title={`No films match “${q}”`}>Check the spelling, or try the original-language title.</EmptyState>
      )}
    </div>
  );
}
