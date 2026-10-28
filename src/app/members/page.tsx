import type { Metadata } from "next";
import { EmptyState } from "@/components/cards";
import { MemberList } from "@/components/member-list";
import { Pagination, pageParam } from "@/components/pagination";
import { findMembers, viewerFollowingSet } from "@/lib/members";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Members" };

const PER_PAGE = 30;

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = pageParam(sp.page);
  const viewer = await getViewer();
  const [members, followingSet] = await Promise.all([
    findMembers({
      where: q
        ? { OR: [{ username: { contains: q, mode: "insensitive" } }, { displayName: { contains: q, mode: "insensitive" } }] }
        : undefined,
      orderBy: [{ entries: { _count: "desc" } }, { createdAt: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE + 1,
    }),
    viewerFollowingSet(viewer?.id),
  ]);

  return (
    <div className="wrap max-w-3xl py-10">
      <h1 className="display mb-2 text-4xl">Members</h1>
      <p className="mb-6 text-muted">The most active diarists first. Follow people to see their activity on your home page.</p>
      <form action="/members" role="search" className="mb-4 flex gap-2">
        <input type="search" name="q" defaultValue={q} placeholder="Find a member by name" aria-label="Find a member by name" className="field" />
        <button className="btn btn-primary">Find</button>
      </form>
      {members.length ? (
        <MemberList members={members.slice(0, PER_PAGE)} viewerId={viewer?.id} followingSet={followingSet} />
      ) : (
        <EmptyState title={q ? `No members match “${q}”` : "No members yet"} />
      )}
      <Pagination
        page={page}
        hasMore={members.length > PER_PAGE}
        href={(p) => `/members?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`}
      />
    </div>
  );
}
