"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/viewer";
import type { FormState } from "@/lib/validation";

async function viewerId() {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Sign in to do that.");
  return viewer.id;
}

export async function setFollowing(targetUserId: string, on: boolean) {
  const followerId = await viewerId();
  if (followerId === targetUserId) return;
  if (on) {
    await db.follow.upsert({
      where: { followerId_followingId: { followerId, followingId: targetUserId } },
      create: { followerId, followingId: targetUserId },
      update: {},
    });
  } else {
    await db.follow.deleteMany({ where: { followerId, followingId: targetUserId } });
  }
  revalidatePath("/", "layout");
}

export async function setEntryLiked(entryId: string, on: boolean) {
  const userId = await viewerId();
  if (on) {
    await db.entryLike.upsert({
      where: { userId_entryId: { userId, entryId } },
      create: { userId, entryId },
      update: {},
    });
  } else {
    await db.entryLike.deleteMany({ where: { userId, entryId } });
  }
  revalidatePath("/", "layout");
}

export async function setListLiked(listId: string, on: boolean) {
  const userId = await viewerId();
  if (on) {
    await db.listLike.upsert({
      where: { userId_listId: { userId, listId } },
      create: { userId, listId },
      update: {},
    });
  } else {
    await db.listLike.deleteMany({ where: { userId, listId } });
  }
  revalidatePath("/", "layout");
}

export async function addComment(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in to comment." };
  const entryId = String(formData.get("entryId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something before posting." };
  if (body.length > 5000) return { error: "Comments can be up to 5,000 characters." };
  const entry = await db.logEntry.findUnique({ where: { id: entryId }, select: { id: true } });
  if (!entry) return { error: "That review no longer exists." };
  await db.comment.create({ data: { entryId, userId: viewer.id, body } });
  revalidatePath(`/review/${entryId}`);
  return { ok: true };
}

/** Comment authors and the review's author can delete a comment. */
export async function deleteComment(commentId: string) {
  const userId = await viewerId();
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: { entry: { select: { userId: true } } },
  });
  if (!comment || (comment.userId !== userId && comment.entry.userId !== userId)) return;
  await db.comment.delete({ where: { id: commentId } });
  revalidatePath(`/review/${comment.entryId}`);
}
