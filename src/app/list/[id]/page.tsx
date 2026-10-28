import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Avatar, displayName } from "@/components/avatar";
import { EmptyState } from "@/components/cards";
import { Poster } from "@/components/poster";
import { Stars } from "@/components/stars";
import { ListLikeButton } from "@/components/toggles";
import { db } from "@/lib/db";
import { filmHref, formatDate, plural } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

const loadList = cache((id: string) =>
  db.list.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
      items: { orderBy: { position: "asc" }, include: { film: true } },
      _count: { select: { likes: true } },
    },
  }),
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const list = await loadList((await params).id);
  if (!list || !list.isPublic) return { title: "List" };
  return { title: `${list.title}, a list by ${displayName(list.user)}`, description: list.description ?? undefined };
}

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const list = await loadList((await params).id);
  const viewer = await getViewer();
  if (!list || (!list.isPublic && list.userId !== viewer?.id)) notFound();
  const mine = viewer?.id === list.userId;
  const [liked, myRatings] = await Promise.all([
    viewer ? db.listLike.findUnique({ where: { userId_listId: { userId: viewer.id, listId: list.id } } }) : null,
    viewer
      ? db.filmStatus.findMany({ where: { userId: viewer.id, filmId: { in: list.items.map((i) => i.filmId) } }, select: { filmId: true, watched: true, rating: true } })
      : [],
  ]);
  const seen = new Map(myRatings.map((r) => [r.filmId, r]));
  const seenCount = myRatings.filter((r) => r.watched).length;
  const withNotes = list.items.some((i) => i.note);

  return (
    <div className="wrap py-10">
      <header className="mb-8 max-w-3xl">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Avatar user={list.user} size={24} />
          <span>
            List by{" "}
            <Link href={`/u/${list.user.username}`} className="font-semibold text-ink hover:text-usher">
              {displayName(list.user)}
            </Link>
          </span>
          <span>Updated {formatDate(list.updatedAt)}</span>
          {!list.isPublic && <span className="rounded-full border border-rule px-2 text-xs">Private</span>}
        </p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">{list.title}</h1>
        {list.description && <p className="mt-4 max-w-[65ch] whitespace-pre-line">{list.description}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-5 text-sm">
          <span className="text-muted">{plural(list.items.length, "film")}</span>
          {viewer && list.items.length > 0 && (
            <span className="text-muted">
              You&apos;ve seen {seenCount} of {list.items.length}
            </span>
          )}
          <ListLikeButton listId={list.id} liked={Boolean(liked)} count={list._count.likes} signedIn={Boolean(viewer)} />
          {mine && (
            <Link href={`/list/${list.id}/edit`} className="btn btn-quiet ml-auto px-3 py-1 text-sm">
              Edit list
            </Link>
          )}
        </div>
      </header>

      {!list.items.length ? (
        <EmptyState title="This list is empty">
          {mine ? <Link href={`/list/${list.id}/edit`} className="link">Add some films</Link> : null}
        </EmptyState>
      ) : withNotes ? (
        <ol className="grid max-w-3xl gap-6">
          {list.items.map((it, i) => (
            <li key={it.filmId} className="flex gap-4">
              {list.ranked && <span className="display w-8 shrink-0 text-right text-2xl text-muted">{i + 1}</span>}
              <div className="w-20 shrink-0">
                <Poster film={it.film} />
              </div>
              <div className="min-w-0">
                <Link href={filmHref(it.film)} className="display text-xl hover:text-usher">
                  {it.film.title}
                </Link>{" "}
                {it.film.year && <span className="text-muted">{it.film.year}</span>}
                {seen.get(it.filmId)?.rating && <Stars rating={seen.get(it.filmId)!.rating} className="ml-2 text-sm" />}
                {it.note && <p className="mt-1 whitespace-pre-line text-[0.95rem]">{it.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
          {list.items.map((it, i) => (
            <li key={it.filmId} className="relative">
              <Poster film={it.film} />
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                {list.ranked && <span className="display text-lg font-semibold text-ink">{i + 1}</span>}
                {seen.get(it.filmId)?.watched && <span title="You've seen this">Seen</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
