import Link from "next/link";
import { Avatar, displayName } from "@/components/avatar";
import { ProfileTabs } from "@/components/profile-tabs";
import { FollowButton } from "@/components/toggles";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/profile";
import { getViewer } from "@/lib/viewer";

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const profile = await getProfile((await params).username);
  const viewer = await getViewer();
  const isMe = viewer?.id === profile.id;
  const following =
    viewer && !isMe
      ? Boolean(await db.follow.findUnique({ where: { followerId_followingId: { followerId: viewer.id, followingId: profile.id } } }))
      : false;
  const base = `/u/${profile.username}`;
  const counts: [number, string, string][] = [
    [profile.watched, "Films", `${base}/films`],
    [profile.thisYear, "This year", `${base}/diary?year=${new Date().getUTCFullYear()}`],
    [profile._count.lists, "Lists", `${base}/lists`],
    [profile._count.following, "Following", `${base}/following`],
    [profile._count.followers, "Followers", `${base}/followers`],
  ];

  return (
    <>
      <div className="border-b border-rule bg-surface">
        <div className="wrap pt-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar user={profile} size={72} link={false} />
              <div className="min-w-0">
                <h1 className="display truncate text-3xl sm:text-4xl">{displayName(profile)}</h1>
                <p className="text-sm text-muted">
                  @{profile.username}
                  {profile.location && <span className="ml-3">{profile.location}</span>}
                  {profile.website && (
                    <a href={profile.website} rel="nofollow noopener" target="_blank" className="link ml-3">
                      {profile.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  )}
                </p>
              </div>
              <div className="ml-2">
                {isMe ? (
                  <Link href="/settings" className="btn btn-quiet px-3 py-1 text-sm">
                    Edit profile
                  </Link>
                ) : (
                  <FollowButton userId={profile.id} following={following} signedIn={Boolean(viewer)} />
                )}
              </div>
            </div>
            <ul className="flex gap-6 sm:ml-auto">
              {counts.map(([n, label, href]) => (
                <li key={label}>
                  <Link href={href} className="flex flex-col items-center hover:text-usher">
                    <span className="display text-2xl font-semibold leading-none">{n.toLocaleString("en-GB")}</span>
                    <span className="mt-1 text-xs text-muted">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {profile.bio && <p className="mt-4 max-w-[65ch] whitespace-pre-line text-[0.95rem]">{profile.bio}</p>}
          <div className="mt-6">
            <ProfileTabs username={profile.username} />
          </div>
        </div>
      </div>
      <div className="wrap py-8">{children}</div>
    </>
  );
}
