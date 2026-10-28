"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProfileTabs({ username }: { username: string }) {
  const path = usePathname();
  const base = `/u/${username}`;
  const tabs = [
    ["", "Profile"],
    ["/films", "Films"],
    ["/diary", "Diary"],
    ["/reviews", "Reviews"],
    ["/watchlist", "Watchlist"],
    ["/lists", "Lists"],
    ["/likes", "Likes"],
    ["/stats", "Stats"],
  ];
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto text-sm" aria-label="Profile">
      {tabs.map(([seg, label]) => {
        const href = base + seg;
        const active = seg ? path.startsWith(href) : path === base;
        return (
          <Link
            key={seg}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 font-semibold ${active ? "border-velvet text-ink dark:border-brass" : "border-transparent text-muted hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
