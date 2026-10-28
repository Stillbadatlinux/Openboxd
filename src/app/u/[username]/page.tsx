import type { Metadata } from "next";
import Link from "next/link";
import { displayName } from "@/components/avatar";
import { EmptyState, ListGrid, ReviewCard } from "@/components/cards";
import { Poster } from "@/components/poster";
import { HeartIcon, Stars } from "@/components/stars";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/profile";
import { entryInclude, listCardInclude, visibleLists } from "@/lib/queries";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).username);
  return { title: `${displayName(p)} (@${p.username})`, description: p.bio ?? undefined };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const profile = await getProfile((await params).username);
  const viewer = await getViewer();
  const isMe = viewer?.id === profile.id;
  const base = `/u/${profile.username}`;

  const [favorites, recent, reviews, lists] = await Promise.all([
    db.film.findMany({ where: { id: { in: profile.favoriteFilmIds } } }),
    db.logEntry.findMany({ where: { userId: profile.id }, include: { film: true }, orderBy: [{ watchedOn: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], take: 8 }),
    db.logEntry.findMany({ where: { userId: profile.id, review: { not: null } }, include: entryInclude, orderBy: { createdAt: "desc" }, take: 3 }),
    db.list.findMany({
      where: { userId: profile.id, AND: [visibleLists(viewer?.id)] },
      include: listCardInclude,
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);
  const favs = profile.favoriteFilmIds.map((id) => favorites.find((f) => f.id === id)).filter((f) => f !== undefined);
  const nothingYet = !favs.length && !recent.length && !lists.length;

  return (
    <div className="grid gap-12">
      <section>
        <h2 className="section-title">
          Favourite films
          {isMe && <Link href="/settings#favourites">{favs.length ? "Change" : "Choose"}</Link>}
        </h2>
        {favs.length ? (
          <ul className="grid max-w-2xl grid-cols-4 gap-3">
            {favs.map((f) => (
              <li key={f.id}>
                <Poster film={f} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{isMe ? "Pick up to four films to show here." : "No favourites chosen yet."}</p>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="section-title">
            Recently watched <Link href={`${base}/diary`}>Diary</Link>
          </h2>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {recent.map((e) => (
              <li key={e.id}>
                <Poster film={e.film} />
                <p className="mt-1 flex items-center gap-1 text-xs">
                  <Stars rating={e.rating} />
                  {e.liked && <HeartIcon className="h-3 w-3 text-heart" />}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {reviews.length > 0 && (
        <section>
          <h2 className="section-title">
            Recent reviews <Link href={`${base}/reviews`}>All reviews</Link>
          </h2>
          {reviews.map((r) => (
            <ReviewCard key={r.id} entry={r} />
          ))}
        </section>
      )}

      {lists.length > 0 && (
        <section>
          <h2 className="section-title">
            Lists <Link href={`${base}/lists`}>All lists</Link>
          </h2>
          <ListGrid lists={lists} />
        </section>
      )}

      {nothingYet && (
        <EmptyState title={isMe ? "Your diary is empty" : `${displayName(profile)} hasn't logged anything yet`}>
          {isMe ? "Use Log a film at the top of the page to add the first one." : null}
        </EmptyState>
      )}
    </div>
  );
}
