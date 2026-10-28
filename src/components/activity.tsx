import Link from "next/link";
import { filmHref, plural, timeAgo } from "@/lib/format";
import type { EntryWithMeta, ListCardData } from "@/lib/queries";
import { Avatar, displayName } from "./avatar";
import { ReviewText } from "./cards";
import { Poster } from "./poster";
import { HeartIcon, RewatchIcon, Stars } from "./stars";

export type FeedItem =
  | { kind: "entry"; at: Date; entry: EntryWithMeta }
  | { kind: "list"; at: Date; list: ListCardData };

export function ActivityFeed({ items }: { items: FeedItem[] }) {
  return (
    <ol className="divide-y divide-rule">
      {items.map((item) =>
        item.kind === "entry" ? (
          <EntryActivity key={`e-${item.entry.id}`} entry={item.entry} />
        ) : (
          <ListActivity key={`l-${item.list.id}`} list={item.list} />
        ),
      )}
    </ol>
  );
}

function EntryActivity({ entry }: { entry: EntryWithMeta }) {
  const verb = entry.review ? "reviewed" : entry.rewatch ? "rewatched" : "watched";
  return (
    <li className="flex gap-3 py-4">
      <Avatar user={entry.user} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.95rem]">
          <Link href={`/u/${entry.user.username}`} className="font-semibold hover:text-usher">
            {displayName(entry.user)}
          </Link>{" "}
          <span className="text-muted">{verb}</span>{" "}
          <Link href={entry.review ? `/review/${entry.id}` : filmHref(entry.film)} className="display text-lg hover:text-usher">
            {entry.film.title}
          </Link>{" "}
          <span className="inline-flex items-center gap-1.5 align-middle">
            <Stars rating={entry.rating} />
            {entry.liked && <HeartIcon className="h-3.5 w-3.5 text-heart" />}
            {entry.rewatch && <RewatchIcon className="h-3.5 w-3.5 text-muted" />}
          </span>
        </p>
        {entry.review && (
          <div className="mt-1.5 text-muted">
            <ReviewText review={entry.review} spoilers={entry.spoilers} clamp />
          </div>
        )}
        <p className="mt-1 flex gap-3 text-xs text-muted">
          <span>{timeAgo(entry.createdAt)}</span>
          {entry._count.likes > 0 && <span>{plural(entry._count.likes, "like")}</span>}
          {entry._count.comments > 0 && <span>{plural(entry._count.comments, "comment")}</span>}
        </p>
      </div>
      <div className="w-12 shrink-0">
        <Poster film={entry.film} />
      </div>
    </li>
  );
}

function ListActivity({ list }: { list: ListCardData }) {
  return (
    <li className="flex gap-3 py-4">
      <Avatar user={list.user} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.95rem]">
          <Link href={`/u/${list.user.username}`} className="font-semibold hover:text-usher">
            {displayName(list.user)}
          </Link>{" "}
          <span className="text-muted">started a list</span>{" "}
          <Link href={`/list/${list.id}`} className="display text-lg hover:text-usher">
            {list.title}
          </Link>
        </p>
        <p className="mt-1 flex gap-3 text-xs text-muted">
          <span>{timeAgo(list.createdAt)}</span>
          <span>{plural(list._count.items, "film")}</span>
        </p>
      </div>
    </li>
  );
}
