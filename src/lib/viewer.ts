import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "./db";

/** The signed-in member, or null. Cached per request. */
export const getViewer = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    select: { id: true, username: true, displayName: true, email: true },
  });
});

export type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;

/** Like getViewer, but sends signed-out visitors to the login page. */
export async function requireViewer(next?: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return viewer;
}
