"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureFilm } from "@/lib/films";
import { getViewer } from "@/lib/viewer";
import { passwordSchema, usernameSchema, type FormState } from "@/lib/validation";

const profileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(80).optional(),
  website: z
    .string()
    .trim()
    .max(200)
    .refine((w) => !w || /^https?:\/\//.test(w), "Websites start with http:// or https://")
    .optional(),
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in to edit your profile." };
  const parsed = profileSchema.safeParse({
    username: formData.get("username") ?? "",
    displayName: formData.get("displayName") || undefined,
    bio: formData.get("bio") || undefined,
    location: formData.get("location") || undefined,
    website: formData.get("website") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.username !== viewer.username) {
    const taken = await db.user.findUnique({ where: { username: d.username } });
    if (taken) return { error: "That username is taken." };
  }
  await db.user.update({
    where: { id: viewer.id },
    data: {
      username: d.username,
      displayName: d.displayName ?? null,
      bio: d.bio ?? null,
      location: d.location ?? null,
      website: d.website ?? null,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function setFavorites(filmIds: number[]) {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Sign in to edit your profile.");
  const ids = [...new Set(filmIds.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 4);
  for (const id of ids) {
    if (!(await ensureFilm(id))) throw new Error("One of those films couldn't be found on TMDB.");
  }
  await db.user.update({ where: { id: viewer.id }, data: { favoriteFilmIds: ids } });
  revalidatePath("/", "layout");
}

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in to change your password." };
  const current = String(formData.get("current") ?? "");
  const next = passwordSchema.safeParse(formData.get("next") ?? "");
  if (!next.success) return { error: next.error.issues[0].message };
  const user = await db.user.findUniqueOrThrow({ where: { id: viewer.id } });
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Your current password is incorrect." };
  await db.user.update({ where: { id: viewer.id }, data: { passwordHash: await bcrypt.hash(next.data, 12) } });
  return { ok: true, message: "Password changed." };
}
