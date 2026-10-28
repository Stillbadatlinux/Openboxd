"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureFilm } from "@/lib/films";
import { getViewer } from "@/lib/viewer";

async function viewerId() {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Sign in to do that.");
  return viewer.id;
}

async function filmOrThrow(filmId: number) {
  const film = await ensureFilm(filmId);
  if (!film) throw new Error("That film couldn't be found on TMDB.");
  return film;
}

const ratingSchema = z.number().int().min(1).max(10).nullable();

/** Sets watched / liked / rating for the signed-in member. Omitted fields are left as they are. */
export async function setFilmStatus(
  filmId: number,
  patch: { watched?: boolean; liked?: boolean; rating?: number | null },
) {
  const userId = await viewerId();
  await filmOrThrow(filmId);
  const data: { watched?: boolean; liked?: boolean; rating?: number | null } = {};
  if (patch.watched !== undefined) data.watched = patch.watched;
  if (patch.liked !== undefined) data.liked = patch.liked;
  if (patch.rating !== undefined) data.rating = ratingSchema.parse(patch.rating);
  // Liking or rating a film implies you've seen it.
  if (data.liked || data.rating) data.watched = true;
  // Un-watching clears rating and like, as there's nothing to rate.
  if (data.watched === false) Object.assign(data, { liked: false, rating: null });

  await db.filmStatus.upsert({
    where: { userId_filmId: { userId, filmId } },
    create: { userId, filmId, ...data },
    update: data,
  });
  if (data.watched) await db.watchlistItem.deleteMany({ where: { userId, filmId } });
  revalidatePath("/", "layout");
}

export async function setWatchlisted(filmId: number, on: boolean) {
  const userId = await viewerId();
  await filmOrThrow(filmId);
  if (on) {
    await db.watchlistItem.upsert({
      where: { userId_filmId: { userId, filmId } },
      create: { userId, filmId },
      update: {},
    });
  } else {
    await db.watchlistItem.deleteMany({ where: { userId, filmId } });
  }
  revalidatePath("/", "layout");
}

const entrySchema = z
  .object({
    entryId: z.string().optional(),
    filmId: z.coerce.number().int().positive(),
    watchedOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    rating: z.coerce.number().int().min(0).max(10),
    liked: z.boolean(),
    rewatch: z.boolean(),
    review: z.string().trim().max(20000).optional(),
    spoilers: z.boolean(),
  })
  .refine((e) => e.watchedOn || e.review, {
    message: "Add the date you watched it, or write a review.",
  });

export type EntryResult = { error?: string; entryId?: string };

/** Creates or updates a diary entry (a viewing, optionally with a review). */
export async function saveEntry(formData: FormData): Promise<EntryResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in to log films." };

  const parsed = entrySchema.safeParse({
    entryId: formData.get("entryId") || undefined,
    filmId: formData.get("filmId"),
    watchedOn: formData.get("watchedOn") ?? "",
    rating: formData.get("rating") || 0,
    liked: formData.get("liked") === "on",
    rewatch: formData.get("rewatch") === "on",
    review: formData.get("review") || undefined,
    spoilers: formData.get("spoilers") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const e = parsed.data;
  const film = await ensureFilm(e.filmId);
  if (!film) return { error: "That film couldn't be found on TMDB." };

  const data = {
    watchedOn: e.watchedOn ? new Date(`${e.watchedOn}T00:00:00Z`) : null,
    rating: e.rating || null,
    liked: e.liked,
    rewatch: e.rewatch,
    review: e.review || null,
    spoilers: e.spoilers && Boolean(e.review),
  };

  let entryId = e.entryId;
  if (entryId) {
    const existing = await db.logEntry.findUnique({ where: { id: entryId } });
    if (!existing || existing.userId !== viewer.id) return { error: "You can only edit your own entries." };
    await db.logEntry.update({ where: { id: entryId }, data });
  } else {
    entryId = (await db.logEntry.create({ data: { ...data, userId: viewer.id, filmId: film.id } })).id;
  }

  // Keep the member's film status in step with their latest entry.
  const statusPatch: { watched: true; liked?: boolean; rating?: number } = { watched: true };
  if (data.liked) statusPatch.liked = true;
  if (data.rating) statusPatch.rating = data.rating;
  await db.filmStatus.upsert({
    where: { userId_filmId: { userId: viewer.id, filmId: film.id } },
    create: { userId: viewer.id, filmId: film.id, ...statusPatch },
    update: statusPatch,
  });
  await db.watchlistItem.deleteMany({ where: { userId: viewer.id, filmId: film.id } });

  revalidatePath("/", "layout");
  return { entryId };
}

export async function deleteEntry(entryId: string) {
  const userId = await viewerId();
  await db.logEntry.deleteMany({ where: { id: entryId, userId } });
  revalidatePath("/", "layout");
}
