import "server-only";
import type { FeedItem } from "@/components/activity";
import { db } from "./db";
import { entryInclude, listCardInclude } from "./queries";

export const FEED_PAGE_SIZE = 20;

/**
 * Activity (diary entries and new public lists) from the given members, newest first.
 * Pass `userIds: null` for site-wide activity.
 */
export async function getFeed(userIds: string[] | null, page = 1) {
  const take = FEED_PAGE_SIZE * page + 1;
  const who = userIds ? { userId: { in: userIds } } : {};
  const [entries, lists] = await Promise.all([
    db.logEntry.findMany({ where: who, include: entryInclude, orderBy: { createdAt: "desc" }, take }),
    db.list.findMany({ where: { ...who, isPublic: true }, include: listCardInclude, orderBy: { createdAt: "desc" }, take }),
  ]);
  const items: FeedItem[] = [
    ...entries.map((entry) => ({ kind: "entry" as const, at: entry.createdAt, entry })),
    ...lists.map((list) => ({ kind: "list" as const, at: list.createdAt, list })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  const start = FEED_PAGE_SIZE * (page - 1);
  return { items: items.slice(start, start + FEED_PAGE_SIZE), hasMore: items.length > start + FEED_PAGE_SIZE };
}

/** Reviews with the most likes in the last `days` days. */
export async function popularReviews(days = 7, take = 6) {
  const since = new Date(Date.now() - days * 864e5);
  const recent = await db.logEntry.findMany({
    where: { review: { not: null }, createdAt: { gte: since } },
    include: entryInclude,
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    take,
  });
  if (recent.length >= take || days >= 365) return recent;
  return db.logEntry.findMany({
    where: { review: { not: null } },
    include: entryInclude,
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    take,
  });
}

export async function popularLists(take = 6) {
  return db.list.findMany({
    where: { isPublic: true, items: { some: {} } },
    include: listCardInclude,
    orderBy: [{ likes: { _count: "desc" } }, { updatedAt: "desc" }],
    take,
  });
}
