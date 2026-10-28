import type { Metadata } from "next";
import Link from "next/link";
import { displayName } from "@/components/avatar";
import { EmptyState, ListGrid, ReviewCard } from "@/components/cards";
import { PosterGrid } from "@/components/poster";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/profile";
import { entryInclude, listCardInclude, visibleLists } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).username);
  return { title: `Liked by ${displayName(p)}` };
}

export default async function LikesTab({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const profile = await getProfile((await params).username);
  const viewer = await getViewer();
  const kindParam = (await searchParams).kind;
  const kind = kindParam === "reviews" || kindParam === "lists" ? kindParam : "films";
  const base = `/u/${profile.username}/likes`;

  let body: React.ReactNode;
  if (kind === "films") {
    const rows = await db.filmStatus.findMany({ where: { userId: profile.id, liked: true }, include: { film: true }, orderBy: { updatedAt: "desc" }, take: 96 });
    body = rows.length ? <PosterGrid dense films={rows.map((r) => r.film)} /> : <EmptyState title="No liked films yet" />;
  } else if (kind === "reviews") {
    const rows = await db.entryLike.findMany({ where: { userId: profile.id }, include: { entry: { include: entryInclude } }, orderBy: { createdAt: "desc" }, take: 30 });
    body = rows.length ? <div className="max-w-3xl">{rows.map((r) => <ReviewCard key={r.entryId} entry={r.entry} />)}</div> : <EmptyState title="No liked reviews yet" />;
  } else {
    const rows = await db.listLike.findMany({
      where: { userId: profile.id, list: visibleLists(viewer?.id) },
      include: { list: { include: listCardInclude } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    body = <ListGrid lists={rows.map((r) => r.list)} empty={<EmptyState title="No liked lists yet" />} />;
  }

  return (
    <>
      <nav className="mb-6 flex gap-2 text-sm" aria-label="Kind of like">
        {[
          ["films", "Films"],
          ["reviews", "Reviews"],
          ["lists", "Lists"],
        ].map(([k, label]) => (
          <Link
            key={k}
            href={k === "films" ? base : `${base}?kind=${k}`}
            aria-current={k === kind ? "page" : undefined}
            className={`rounded-full border px-3 py-1 ${k === kind ? "border-ink font-semibold" : "border-rule text-muted hover:text-ink"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {body}
    </>
  );
}
