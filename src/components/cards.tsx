/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { filmHref, formatDate, plural, posterUrl, timeAgo } from "@/lib/format";
import { toISODate, type EntryWithMeta, type ListCardData } from "@/lib/queries";
import { Avatar, displayName } from "./avatar";
import { LogButton } from "./log-dialog";
import { Poster } from "./poster";
import { HeartIcon, RewatchIcon, ReviewIcon, Stars } from "./stars";

/** Review text that hides spoilers until the reader opts in. */
export function ReviewText({ review, spoilers, clamp = false }: { review: string; spoilers: boolean; clamp?: boolean }) {
  const text = <p className={`prose-review ${clamp ? "line-clamp-5" : ""}`}>{review}</p>;
  if (!spoilers) return text;
  return (
    <details className="group">
      <summary className="cursor-pointer text-sm text-muted">
        This review may contain spoilers. <span className="link">Show it anyway</span>
      </summary>
      <div className="mt-2">{text}</div>
    </details>
  );
}

/** A review in a feed or on a film page. */
export function ReviewCard({ entry, showFilm = true }: { entry: EntryWithMeta; showFilm?: boolean }) {
  return (
    <article className="flex gap-4 border-b border-rule py-5 last:border-b-0">
      {showFilm ? (
        <div className="w-16 shrink-0 sm:w-20">
          <Poster film={entry.film} />
        </div>
      ) : (
        <Avatar user={entry.user} size={40} />
      )}
      <div className="min-w-0 flex-1">
        {showFilm && (
          <h3 className="display text-xl">
            <Link href={filmHref(entry.film)} className="hover:text-usher">
              {entry.film.title}
            </Link>{" "}
            {entry.film.year && <span className="text-base text-muted">{entry.film.year}</span>}
          </h3>
        )}
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
          {showFilm && <Avatar user={entry.user} size={20} />}
          <span>
            Review by{" "}
            <Link href={`/u/${entry.user.username}`} className="font-semibold text-ink hover:text-usher">
              {displayName(entry.user)}
            </Link>
          </span>
          <Stars rating={entry.rating} />
          {entry.liked && <HeartIcon className="h-3.5 w-3.5 text-heart" />}
          {entry.rewatch && <RewatchIcon className="h-3.5 w-3.5" />}
        </p>
        {entry.review &&
          (entry.spoilers ? (
            <div className="mt-2">
              <ReviewText review={entry.review} spoilers clamp />
            </div>
          ) : (
            <Link href={`/review/${entry.id}`} className="mt-2 block hover:opacity-90">
              <ReviewText review={entry.review} spoilers={false} clamp />
            </Link>
          ))}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 whitespace-nowrap text-sm text-muted">
          <Link href={`/review/${entry.id}`} className="hover:text-ink">
            {plural(entry._count.likes, "like")}
          </Link>
          <Link href={`/review/${entry.id}#comments`} className="hover:text-ink">
            {plural(entry._count.comments, "comment")}
          </Link>
          <span>{entry.watchedOn ? `Watched ${formatDate(entry.watchedOn)}` : timeAgo(entry.createdAt)}</span>
        </p>
      </div>
    </article>
  );
}

/** A diary row, cut like a ticket stub. */
export function DiaryRow({ entry, editable }: { entry: EntryWithMeta; editable: boolean }) {
  const d = entry.watchedOn ?? entry.createdAt;
  const film = { id: entry.film.id, title: entry.film.title, year: entry.film.year, posterPath: entry.film.posterPath };
  return (
    <li className="stub">
      <div className="stub-date">
        <span className="display text-3xl font-semibold leading-none">{d.getUTCDate()}</span>
        <span className="mt-1 text-xs font-semibold">
          {d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })} {d.getUTCFullYear()}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-3 p-2.5 pl-4">
        <div className="w-10 shrink-0">
          <Poster film={film} />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={filmHref(entry.film)} className="display block truncate text-lg hover:text-usher">
            {entry.film.title} {entry.film.year && <span className="text-sm text-muted">{entry.film.year}</span>}
          </Link>
          <span className="flex items-center gap-2 text-sm text-muted">
            <Stars rating={entry.rating} />
            {entry.liked && <HeartIcon className="h-3.5 w-3.5 text-heart" />}
            {entry.rewatch && (
              <span title="Rewatch">
                <RewatchIcon className="h-3.5 w-3.5" />
              </span>
            )}
            {entry.review && (
              <Link href={`/review/${entry.id}`} title="Read the review" className="hover:text-ink">
                <ReviewIcon className="h-4 w-4" />
              </Link>
            )}
            {!entry.watchedOn && <span>No watch date</span>}
          </span>
        </div>
        {editable && (
          <LogButton
            film={film}
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
            className="btn btn-quiet px-3 py-1 text-sm"
          />
        )}
      </div>
    </li>
  );
}

/** A list preview: fanned-out posters, title, author and counts. */
export function ListCard({ list }: { list: ListCardData }) {
  return (
    <article className="group">
      <Link href={`/list/${list.id}`} className="block">
        <div className="flex h-36 items-end overflow-hidden rounded-lg border border-rule bg-surface p-3 pb-0 sm:h-40">
          {list.items.length ? (
            list.items.map((it, i) => (
              <span
                key={it.filmId}
                className="relative block aspect-[2/3] w-[28%] shrink-0 overflow-hidden rounded-t-[4px] bg-rule shadow-[2px_0_6px_rgba(0,0,0,0.25)] transition-transform group-hover:-translate-y-1"
                style={{ marginLeft: i ? "-8%" : 0, zIndex: 10 - i, transitionDelay: `${i * 30}ms` }}
              >
                {it.film.posterPath && (
                  <img src={posterUrl(it.film.posterPath, "w185")!} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </span>
            ))
          ) : (
            <span className="self-center pb-3 text-sm text-muted">No films yet</span>
          )}
        </div>
      </Link>
      <h3 className="display mt-2 text-lg leading-tight">
        <Link href={`/list/${list.id}`} className="hover:text-usher">
          {list.title}
        </Link>
        {!list.isPublic && <span className="ml-2 align-middle text-xs text-muted">Private</span>}
      </h3>
      <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
        <Avatar user={list.user} size={18} />
        <Link href={`/u/${list.user.username}`} className="hover:text-ink">
          {displayName(list.user)}
        </Link>
        <span>{plural(list._count.items, "film")}</span>
        {list._count.likes > 0 && <span>{plural(list._count.likes, "like")}</span>}
      </p>
    </article>
  );
}

export function ListGrid({ lists, empty }: { lists: ListCardData[]; empty?: React.ReactNode }) {
  if (!lists.length) return <>{empty}</>;
  return (
    <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {lists.map((l) => (
        <ListCard key={l.id} list={l} />
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-rule px-6 py-10 text-center">
      <p className="display text-xl">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>}
    </div>
  );
}
