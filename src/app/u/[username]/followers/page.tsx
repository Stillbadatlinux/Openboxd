import type { Metadata } from "next";
import { displayName } from "@/components/avatar";
import { EmptyState } from "@/components/cards";
import { MemberList } from "@/components/member-list";
import { findMembers, viewerFollowingSet } from "@/lib/members";
import { getProfile } from "@/lib/profile";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).username);
  return { title: `Followers · ${displayName(p)}` };
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const profile = await getProfile((await params).username);
  const viewer = await getViewer();
  const [members, followingSet] = await Promise.all([
    findMembers({ where: { following: { some: { followingId: profile.id } } }, orderBy: [{ username: "asc" }], take: 500 }),
    viewerFollowingSet(viewer?.id),
  ]);
  return (
    <div className="max-w-2xl">
      <h2 className="display mb-2 text-2xl">Followers</h2>
      {members.length ? (
        <MemberList members={members} viewerId={viewer?.id} followingSet={followingSet} />
      ) : (
        <EmptyState title="No followers yet" />
      )}
    </div>
  );
}
