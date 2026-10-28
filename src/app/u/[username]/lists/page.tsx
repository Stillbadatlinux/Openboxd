import type { Metadata } from "next";
import Link from "next/link";
import { displayName } from "@/components/avatar";
import { EmptyState, ListGrid } from "@/components/cards";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/profile";
import { listCardInclude, visibleLists } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).username);
  return { title: `Lists by ${displayName(p)}` };
}

export default async function ListsTab({ params }: { params: Promise<{ username: string }> }) {
  const profile = await getProfile((await params).username);
  const viewer = await getViewer();
  const isMe = viewer?.id === profile.id;
  const lists = await db.list.findMany({
    where: { userId: profile.id, AND: [visibleLists(viewer?.id)] },
    include: listCardInclude,
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      {isMe && (
        <div className="mb-6">
          <Link href="/lists/new" className="btn btn-primary">
            Start a new list
          </Link>
        </div>
      )}
      <ListGrid
        lists={lists}
        empty={<EmptyState title="No lists yet">{isMe ? "Lists can be rankings, themes, or anything you like." : null}</EmptyState>}
      />
    </>
  );
}
