"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureFilm } from "@/lib/films";
import { getViewer } from "@/lib/viewer";
import type { FormState } from "@/lib/validation";

const listSchema = z.object({
  title: z.string().trim().min(1, "Give your list a name.").max(120, "List names can be up to 120 characters."),
  description: z.string().trim().max(5000).optional(),
  ranked: z.boolean(),
  isPublic: z.boolean(),
});

function readList(formData: FormData) {
  return listSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") || undefined,
    ranked: formData.get("ranked") === "on",
    isPublic: formData.get("isPublic") === "on",
  });
}

async function ownList(listId: string) {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Sign in to edit lists.");
  const list = await db.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== viewer.id) throw new Error("You can only edit your own lists.");
  return list;
}

export async function createList(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in to make lists." };
  const parsed = readList(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const list = await db.list.create({ data: { ...parsed.data, userId: viewer.id } });

  // Optional first film (when creating a list from a film page).
  const filmId = Number(formData.get("filmId"));
  if (filmId && (await ensureFilm(filmId))) {
    await db.listItem.create({ data: { listId: list.id, filmId, position: 0 } });
  }
  revalidatePath("/", "layout");
  redirect(`/list/${list.id}/edit`);
}

export async function updateList(_: FormState, formData: FormData): Promise<FormState> {
  const listId = String(formData.get("listId"));
  try {
    await ownList(listId);
  } catch (err) {
    return { error: (err as Error).message };
  }
  const parsed = readList(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.list.update({ where: { id: listId }, data: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true, message: "List details saved." };
}

export async function deleteList(listId: string) {
  const list = await ownList(listId);
  await db.list.delete({ where: { id: list.id } });
  revalidatePath("/", "layout");
  const viewer = await getViewer();
  redirect(`/u/${viewer!.username}/lists`);
}

export async function addFilmToList(listId: string, filmId: number) {
  await ownList(listId);
  const film = await ensureFilm(filmId);
  if (!film) throw new Error("That film couldn't be found on TMDB.");
  const last = await db.listItem.findFirst({ where: { listId }, orderBy: { position: "desc" } });
  await db.listItem.upsert({
    where: { listId_filmId: { listId, filmId } },
    create: { listId, filmId, position: (last?.position ?? -1) + 1 },
    update: {},
  });
  await db.list.update({ where: { id: listId }, data: { updatedAt: new Date() } });
  revalidatePath("/", "layout");
}

export async function removeFilmFromList(listId: string, filmId: number) {
  await ownList(listId);
  await db.listItem.deleteMany({ where: { listId, filmId } });
  revalidatePath("/", "layout");
}

/** Moves a film one place up or down, renumbering positions so they stay contiguous. */
export async function moveListItem(listId: string, filmId: number, direction: "up" | "down") {
  await ownList(listId);
  const items = await db.listItem.findMany({ where: { listId }, orderBy: { position: "asc" } });
  const i = items.findIndex((it) => it.filmId === filmId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= items.length) return;
  [items[i], items[j]] = [items[j], items[i]];
  await db.$transaction(
    items.map((it, position) =>
      db.listItem.update({ where: { listId_filmId: { listId, filmId: it.filmId } }, data: { position } }),
    ),
  );
  revalidatePath("/", "layout");
}

export async function setListItemNote(listId: string, filmId: number, note: string) {
  await ownList(listId);
  await db.listItem.update({
    where: { listId_filmId: { listId, filmId } },
    data: { note: note.trim().slice(0, 1000) || null },
  });
  revalidatePath("/", "layout");
}
