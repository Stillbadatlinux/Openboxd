import Link from "next/link";
import { plural } from "@/lib/format";
import { Avatar, displayName } from "./avatar";
import { FollowButton } from "./toggles";

export type MemberRow = {
  id: string;
  username: string;
  displayName: string | null;
  bio?: string | null;
  films: number;
  reviews: number;
};

export function MemberList({
  members,
  viewerId,
  followingSet,
}: {
  members: MemberRow[];
  viewerId?: string;
  followingSet: Set<string>;
}) {
  return (
    <ul className="divide-y divide-rule">
      {members.map((m) => (
        <li key={m.id} className="flex items-center gap-4 py-4">
          <Avatar user={m} size={44} />
          <div className="min-w-0 flex-1">
            <Link href={`/u/${m.username}`} className="font-semibold hover:text-usher">
              {displayName(m)}
            </Link>
            <p className="flex gap-3 text-sm text-muted">
              <span>{plural(m.films, "film")}</span>
              <span>{plural(m.reviews, "review")}</span>
            </p>
            {m.bio && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{m.bio}</p>}
          </div>
          {viewerId !== m.id && <FollowButton userId={m.id} following={followingSet.has(m.id)} signedIn={Boolean(viewerId)} />}
        </li>
      ))}
    </ul>
  );
}
