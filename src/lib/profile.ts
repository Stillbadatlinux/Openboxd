import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

/** Loads a member by username (case-insensitive) with headline counts, or 404s. */
export const getProfile = cache(async (username: string) => {
  const user = await db.user.findUnique({
    where: { username: decodeURIComponent(username).toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      location: true,
      website: true,
      favoriteFilmIds: true,
      createdAt: true,
      _count: { select: { followers: true, following: true, lists: true, watchlist: true } },
    },
  });
  if (!user) notFound();
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const [watched, thisYear] = await Promise.all([
    db.filmStatus.count({ where: { userId: user.id, watched: true } }),
    db.logEntry.count({ where: { userId: user.id, watchedOn: { gte: yearStart } } }),
  ]);
  return { ...user, watched, thisYear };
});

export type Profile = Awaited<ReturnType<typeof getProfile>>;
