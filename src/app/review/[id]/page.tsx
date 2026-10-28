import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Avatar, displayName } from "@/components/avatar";
import { ReviewText } from "@/components/cards";
import { CommentForm, DeleteCommentButton } from "@/components/comments";
import { LogButton } from "@/components/log-dialog";
import { Poster } from "@/components/poster";
import { HeartIcon, RewatchIcon, Stars } from "@/components/stars";
import { EntryLikeButton } from "@/components/toggles";
import { db } from "@/lib/db";
import { filmHref, formatDate, plural, timeAgo } from "@/lib/format";
import { toISODate } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

const loadEntry = cache((id: string) =>
  db.logEntry.findUnique({
    where: { id },
    include: {
      film: true,
      user: { select: { id: true, username: true, displayName: true } },
      comments: { include: { user: { select: { id: true, username: true, displayName: true } } }, orderBy: { createdAt: "asc" } },
      _count: { select: { likes: true } },
    },
  }),
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const e = await loadEntry((await params).id);
  if (!e) return { title: "Review not found" };
  return {
    title: `${displayName(e.user)}'s review of ${e.film.title}`,
    description: e.spoilers ? undefined : e.review?.slice(0, 160),
  };
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const entry = await loadEntry((await params).id);
  if (!entry) notFound();
  const viewer = await getViewer();
  const liked = viewer
    ? Boolean(await db.entryLike.findUnique({ where: { userId_entryId: { userId: viewer.id, entryId: entry.id } } }))
    : false;
  const mine = viewer?.id === entry.userId;
  const verb = entry.review ? "Review" : "Diary entry";

  return (
    <div className="wrap grid max-w-5xl gap-8 py-10 sm:grid-cols-[10rem_1fr]">
      <div className="w-32 sm:w-full">
        <Poster film={entry.film} />
      </div>
      <article className="min-w-0">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Avatar user={entry.user} size={24} />
          <span>
            {verb} by{" "}
            <Link href={`/u/${entry.user.username}`} className="font-semibold text-ink hover:text-usher">
              {displayName(entry.user)}
            </Link>
          </span>
        </p>
        <h1 className="display mt-3 text-4xl">
          <Link href={filmHref(entry.film)} className="hover:text-usher">
            {entry.film.title}
          </Link>{" "}
          {entry.film.year && <span className="text-2xl text-muted">{entry.film.year}</span>}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-muted">
          <Stars rating={entry.rating} className="text-xl" />
          {entry.liked && (
            <span className="inline-flex items-center gap-1 text-sm text-heart">
              <HeartIcon className="h-4 w-4" /> Liked
            </span>
          )}
          {entry.rewatch && (
            <span className="inline-flex items-center gap-1 text-sm">
              <RewatchIcon /> Rewatch
            </span>
          )}
          <span className="text-sm">
            {entry.watchedOn ? `Watched ${formatDate(entry.watchedOn)}` : `Added ${formatDate(entry.createdAt)}`}
          </span>
        </p>

        {entry.review && (
          <div className="mt-6">
            <ReviewText review={entry.review} spoilers={entry.spoilers} />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-rule py-3">
          <EntryLikeButton entryId={entry.id} liked={liked} count={entry._count.likes} signedIn={Boolean(viewer)} />
          {mine && (
            <LogButton
              film={{ id: entry.film.id, title: entry.film.title, year: entry.film.year, posterPath: entry.film.posterPath }}
              entry={{
                id: entry.id,
                watchedOn: toISODate(entry.watchedOn),
                rating: entry.rating,
                liked: entry.liked,
                rewatch: entry.rewatch,
                review: entry.review,
                spoilers: entry.spoilers,
              }}
              label="Edit"
              className="btn btn-quiet ml-auto px-3 py-1 text-sm"
            />
          )}
        </div>

        <section id="comments" className="mt-8">
          <h2 className="section-title text-xl">{plural(entry.comments.length, "comment")}</h2>
          <ul className="mb-6 grid gap-5">
            {entry.comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <Avatar user={c.user} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-3 text-sm">
                    <Link href={`/u/${c.user.username}`} className="font-semibold hover:text-usher">
                      {displayName(c.user)}
                    </Link>
                    <span className="text-xs text-muted">{timeAgo(c.createdAt)}</span>
                    {viewer && (viewer.id === c.userId || mine) && <DeleteCommentButton commentId={c.id} />}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line [overflow-wrap:anywhere]">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
          {viewer ? (
            <CommentForm entryId={entry.id} />
          ) : (
            <p className="text-sm text-muted">
              <Link href={`/login?next=/review/${entry.id}`} className="link">
                Sign in
              </Link>{" "}
              to comment.
            </p>
          )}
        </section>
      </article>
    </div>
  );
}
