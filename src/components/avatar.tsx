import Link from "next/link";

// Avatars are generated from the username so no file storage is needed.
const HUES = [348, 18, 42, 160, 182, 205, 262, 292];

function hueFor(username: string) {
  let h = 0;
  for (const c of username) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length];
}

export function Avatar({
  user,
  size = 32,
  link = true,
}: {
  user: { username: string; displayName?: string | null };
  size?: number;
  link?: boolean;
}) {
  const name = user.displayName || user.username;
  const initials = name
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const hue = hueFor(user.username);
  const el = (
    <span
      className="display inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `oklch(0.45 0.09 ${hue})`,
        color: `oklch(0.96 0.03 ${hue})`,
      }}
      aria-hidden={link ? undefined : true}
      title={link ? undefined : name}
    >
      {initials}
    </span>
  );
  if (!link) return el;
  return (
    <Link href={`/u/${user.username}`} aria-label={name} className="inline-flex rounded-full">
      {el}
    </Link>
  );
}

export function displayName(user: { username: string; displayName?: string | null }) {
  return user.displayName || user.username;
}
