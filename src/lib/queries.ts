import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

export const userCard = { select: { id: true, username: true, displayName: true } } as const;

export const entryInclude = {
  film: true,
  user: userCard,
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.LogEntryInclude;

export type EntryWithMeta = Prisma.LogEntryGetPayload<{ include: typeof entryInclude }>;

export const listCardInclude = {
  user: userCard,
  items: { take: 5, orderBy: { position: "asc" }, include: { film: true } },
  _count: { select: { items: true, likes: true } },
} satisfies Prisma.ListInclude;

export type ListCardData = Prisma.ListGetPayload<{ include: typeof listCardInclude }>;

/** Which of these entries / lists the viewer has liked. */
export async function likedEntryIds(viewerId: string | undefined, entryIds: string[]) {
  if (!viewerId || !entryIds.length) return new Set<string>();
  const rows = await db.entryLike.findMany({ where: { userId: viewerId, entryId: { in: entryIds } }, select: { entryId: true } });
  return new Set(rows.map((r) => r.entryId));
}

export async function likedListIds(viewerId: string | undefined, listIds: string[]) {
  if (!viewerId || !listIds.length) return new Set<string>();
  const rows = await db.listLike.findMany({ where: { userId: viewerId, listId: { in: listIds } }, select: { listId: true } });
  return new Set(rows.map((r) => r.listId));
}

export async function followingIds(userId: string) {
  const rows = await db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  return rows.map((r) => r.followingId);
}

/** Lists visible to the viewer: public ones, plus their own private ones. */
export function visibleLists(viewerId: string | undefined): Prisma.ListWhereInput {
  return viewerId ? { OR: [{ isPublic: true }, { userId: viewerId }] } : { isPublic: true };
}

export function toISODate(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null;
}
