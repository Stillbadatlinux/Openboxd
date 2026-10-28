import "server-only";
import { db } from "./db";

export async function filmStats(filmId: number) {
  const [watched, liked, ratings, lists, entries] = await Promise.all([
    db.filmStatus.count({ where: { filmId, watched: true } }),
    db.filmStatus.count({ where: { filmId, liked: true } }),
    db.filmStatus.groupBy({ by: ["rating"], where: { filmId, rating: { not: null } }, _count: true }),
    db.listItem.count({ where: { filmId, list: { isPublic: true } } }),
    db.logEntry.count({ where: { filmId } }),
  ]);
  const histogram = Array.from({ length: 10 }, (_, i) => ratings.find((r) => r.rating === i + 1)?._count ?? 0);
  const total = histogram.reduce((a, b) => a + b, 0);
  const average = total ? histogram.reduce((sum, n, i) => sum + n * (i + 1), 0) / total / 2 : null;
  return { watched, liked, lists, entries, histogram, ratingsCount: total, average };
}
