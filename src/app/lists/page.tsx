import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, ListGrid } from "@/components/cards";
import { Pagination, pageParam } from "@/components/pagination";
import { db } from "@/lib/db";
import { popularLists } from "@/lib/feed";
import { listCardInclude } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Lists" };

const PER_PAGE = 24;

export default async function ListsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageParam((await searchParams).page);
  const viewer = await getViewer();
  const [popular, recent] = await Promise.all([
    page === 1 ? popularLists(3) : [],
    db.list.findMany({
      where: { isPublic: true, items: { some: {} } },
      include: listCardInclude,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE + 1,
    }),
  ]);
  return (
    <div className="wrap py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Lists</h1>
          <p className="mt-1 text-muted">Rankings, themes, marathons and recommendations from members.</p>
        </div>
        <Link href={viewer ? "/lists/new" : "/login?next=/lists/new"} className="btn btn-primary">
          Start a new list
        </Link>
      </div>
      {popular.length > 0 && (
        <section className="mb-12">
          <h2 className="section-title">Most liked</h2>
          <ListGrid lists={popular} />
        </section>
      )}
      <section>
        <h2 className="section-title">Recently updated</h2>
        <ListGrid lists={recent.slice(0, PER_PAGE)} empty={<EmptyState title="No lists yet">Be the first to make one.</EmptyState>} />
        <Pagination page={page} hasMore={recent.length > PER_PAGE} href={(p) => `/lists?page=${p}`} />
      </section>
    </div>
  );
}
