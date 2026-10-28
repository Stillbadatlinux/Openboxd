import "server-only";
import type { Prisma } from "@prisma/client";
import type { MemberRow } from "@/components/member-list";
import { db } from "./db";
import { followingIds } from "./queries";

const memberSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  _count: {
    select: {
      statuses: { where: { watched: true } },
      entries: { where: { review: { not: null } } },
    },
  },
} satisfies Prisma.UserSelect;

type Raw = Prisma.UserGetPayload<{ select: typeof memberSelect }>;

function toRow(u: Raw): MemberRow {
  return { id: u.id, username: u.username, displayName: u.displayName, bio: u.bio, films: u._count.statuses, reviews: u._count.entries };
}

export async function findMembers(args: { where?: Prisma.UserWhereInput; orderBy?: Prisma.UserOrderByWithRelationInput[]; skip?: number; take: number }) {
  const users = await db.user.findMany({ ...args, select: memberSelect });
  return users.map(toRow);
}

export async function viewerFollowingSet(viewerId?: string) {
  return new Set(viewerId ? await followingIds(viewerId) : []);
}
