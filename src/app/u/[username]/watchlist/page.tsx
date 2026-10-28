import type { Metadata } from "next";
import { displayName } from "@/components/avatar";
import { EmptyState } from "@/components/cards";
import { Pagination, pageParam } from "@/components/pagination";
import { PosterGrid } from "@/components/poster";
import { db } from "@/lib/db";
import { plural } from "@/lib/format";
import { getProfile } from "@/lib/profile";
import { getViewer } from "@/lib/viewer";

const PER_PAGE = 48;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).username);
  return { title: `${displayName(p)}'s watchlist` };
}

export default async function WatchlistTab({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await getProfile((await params).username);
  const viewer = await getViewer();
  const page = pageParam((await searchParams).page);
  const rows = await db.watchlistItem.findMany({
    where: { userId: profile.id },
    include: { film: true },
    orderBy: { addedAt: "desc" },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE + 1,
  });
  const isMe = viewer?.id === profile.id;
  return (
    <>
      <h2 className="display mb-5 text-2xl">
        {isMe ? "Films you want to see" : `Films ${displayName(profile)} wants to see`}{" "}
        <span className="text-base text-muted">{plural(profile._count.watchlist, "film")}</span>
      </h2>
      {rows.length ? (
        <PosterGrid dense films={rows.slice(0, PER_PAGE).map((r) => r.film)} />
      ) : (
        <EmptyState title="The watchlist is empty">
          {isMe ? "Use the Watchlist button on any film page to save it for later." : null}
        </EmptyState>
      )}
      <Pagination page={page} hasMore={rows.length > PER_PAGE} href={(p) => `/u/${profile.username}/watchlist?page=${p}`} />
    </>
  );
}
