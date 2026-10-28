"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { matchFilm } from "@/lib/films";
import { getViewer } from "@/lib/viewer";
import type { ImportKind, ImportRow } from "@/lib/import-types";

export type ImportChunkResult = { imported: number; missed: string[]; error?: string };

function halfStars(rating?: string) {
  const n = Number(rating);
  return Number.isFinite(n) && n > 0 ? Math.min(10, Math.max(1, Math.round(n * 2))) : null;
}

function asDate(d?: string) {
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00Z`) : null;
}

async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

/**
 * Imports one chunk of rows from a Letterboxd export CSV. The client sends small chunks
 * so each request stays well inside serverless time limits.
 */
export async function importChunk(kind: ImportKind, rows: ImportRow[]): Promise<ImportChunkResult> {
  const viewer = await getViewer();
  if (!viewer) return { imported: 0, missed: [], error: "Sign in to import." };
  const userId = viewer.id;
  const missed: string[] = [];
  let imported = 0;

  await inBatches(rows.slice(0, 50), 4, async (row) => {
    const year = Number(row.year) || null;
    let film;
    try {
      film = await matchFilm(row.name, year);
    } catch {
      film = null;
    }
    if (!film) {
      missed.push(year ? `${row.name} (${year})` : row.name);
      return;
    }
    const filmId = film.id;
    const rating = halfStars(row.rating);

    const status = (patch: { watched?: boolean; liked?: boolean; rating?: number | null }) =>
      db.filmStatus.upsert({
        where: { userId_filmId: { userId, filmId } },
        create: { userId, filmId, watched: true, ...patch },
        update: { watched: true, ...patch },
      });

    switch (kind) {
      case "watched":
        await status({});
        break;
      case "ratings":
        if (rating) await status({ rating });
        break;
      case "likes":
        await status({ liked: true });
        break;
      case "watchlist":
        await db.watchlistItem.upsert({
          where: { userId_filmId: { userId, filmId } },
          create: { userId, filmId, addedAt: asDate(row.date) ?? new Date() },
          update: {},
        });
        break;
      case "diary":
      case "reviews": {
        const watchedOn = asDate(row.watchedDate) ?? (kind === "diary" ? asDate(row.date) : null);
        const review = kind === "reviews" ? row.review?.trim() || null : undefined;
        // Re-importing the same export shouldn't create duplicates.
        const existing = await db.logEntry.findFirst({ where: { userId, filmId, watchedOn } });
        const data = {
          rating,
          rewatch: row.rewatch?.toLowerCase() === "yes",
          ...(review !== undefined ? { review } : {}),
        };
        if (existing) await db.logEntry.update({ where: { id: existing.id }, data });
        else
          await db.logEntry.create({
            data: { userId, filmId, watchedOn, ...data, createdAt: asDate(row.date) ?? new Date() },
          });
        await status(rating ? { rating } : {});
        break;
      }
    }
    imported++;
  });

  revalidatePath("/", "layout");
  return { imported, missed };
}

/** Sets profile favourites from the export's profile.csv, unless the member already chose some. */
export async function importFavorites(films: { name: string; year?: string }[]): Promise<{ set: number }> {
  const viewer = await getViewer();
  if (!viewer || !films.length) return { set: 0 };
  const user = await db.user.findUnique({ where: { id: viewer.id }, select: { favoriteFilmIds: true } });
  if (user?.favoriteFilmIds.length) return { set: 0 };
  const ids: number[] = [];
  for (const f of films.slice(0, 4)) {
    const film = await matchFilm(f.name, Number(f.year) || null).catch(() => null);
    if (film && !ids.includes(film.id)) ids.push(film.id);
  }
  if (ids.length) await db.user.update({ where: { id: viewer.id }, data: { favoriteFilmIds: ids } });
  revalidatePath("/", "layout");
  return { set: ids.length };
}
