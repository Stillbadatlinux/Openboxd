import type { Metadata } from "next";
import { displayName } from "@/components/avatar";
import { EmptyState, ReviewCard } from "@/components/cards";
import { Pagination, pageParam } from "@/components/pagination";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/profile";
import { entryInclude } from "@/lib/queries";

const PER_PAGE = 20;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).username);
  return { title: `Reviews by ${displayName(p)}` };
}

export default async function ReviewsTab({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await getProfile((await params).username);
  const page = pageParam((await searchParams).page);
  const rows = await db.logEntry.findMany({
    where: { userId: profile.id, review: { not: null } },
    include: entryInclude,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE + 1,
  });
  return (
    <div className="max-w-3xl">
      {rows.length ? rows.slice(0, PER_PAGE).map((r) => <ReviewCard key={r.id} entry={r} />) : <EmptyState title="No reviews yet" />}
      <Pagination page={page} hasMore={rows.length > PER_PAGE} href={(p) => `/u/${profile.username}/reviews?page=${p}`} prevLabel="Newer" nextLabel="Older" />
    </div>
  );
}
