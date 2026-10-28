import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { displayName } from "@/components/avatar";
import { EmptyState } from "@/components/cards";
import { Pagination, pageParam } from "@/components/pagination";
import { PosterGrid } from "@/components/poster";
import { HeartIcon, Stars } from "@/components/stars";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/profile";

const PER_PAGE = 48;
const SORTS: Record<string, [string, Prisma.FilmStatusOrderByWithRelationInput[]]> = {
  recent: ["Recently updated", [{ updatedAt: "desc" }]],
  rating: ["Highest rated", [{ rating: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }]],
  release: ["Release date", [{ film: { releaseDate: { sort: "desc", nulls: "last" } } }]],
  title: ["Title", [{ film: { title: "asc" } }]],
};

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).username);
  return { title: `Films watched by ${displayName(p)}` };
}

export default async function FilmsTab({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const profile = await getProfile((await params).username);
  const sp = await searchParams;
  const sort = sp.sort && sp.sort in SORTS ? sp.sort : "recent";
  const page = pageParam(sp.page);
  const rows = await db.filmStatus.findMany({
    where: { userId: profile.id, watched: true },
    include: { film: true },
    orderBy: SORTS[sort][1],
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE + 1,
  });
  const base = `/u/${profile.username}/films`;
  const byId = new Map(rows.map((r) => [r.filmId, r]));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-2xl">Watched</h2>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Sort films">
          {Object.entries(SORTS).map(([key, [label]]) => (
            <Link
              key={key}
              href={key === "recent" ? base : `${base}?sort=${key}`}
              aria-current={key === sort ? "page" : undefined}
              className={`rounded-full border px-3 py-1 ${key === sort ? "border-ink font-semibold" : "border-rule text-muted hover:text-ink"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {rows.length ? (
        <PosterGrid
          dense
          films={rows.slice(0, PER_PAGE).map((r) => r.film)}
          footer={(f) => {
            const s = byId.get(f.id)!;
            return (
              <p className="mt-1 flex h-4 items-center gap-1 text-[0.7rem]">
                <Stars rating={s.rating} />
                {s.liked && <HeartIcon className="h-3 w-3 text-heart" />}
              </p>
            );
          }}
        />
      ) : (
        <EmptyState title="No films marked as watched yet" />
      )}
      <Pagination
        page={page}
        hasMore={rows.length > PER_PAGE}
        href={(p) => `${base}?${new URLSearchParams({ ...(sort !== "recent" ? { sort } : {}), page: String(p) })}`}
      />
    </>
  );
}
