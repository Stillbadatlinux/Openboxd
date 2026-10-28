import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { SITE_NAME } from "@/lib/site";
import { getViewer } from "@/lib/viewer";
import { Avatar } from "./avatar";
import { LogButton } from "./log-dialog";

export async function Header() {
  const viewer = await getViewer();
  return (
    <header className="bg-velvet text-velvet-ink">
      <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
        <Link href="/" className="display text-[1.85rem] font-semibold italic leading-none tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="flex gap-5 text-sm font-semibold" aria-label="Main">
          <Link href="/films" className="opacity-85 hover:opacity-100">
            Films
          </Link>
          <Link href="/lists" className="opacity-85 hover:opacity-100">
            Lists
          </Link>
          <Link href="/members" className="opacity-85 hover:opacity-100">
            Members
          </Link>
        </nav>
        <form action="/films" className="order-last w-full sm:order-none sm:ml-auto sm:w-56" role="search">
          <input
            type="search"
            name="q"
            placeholder="Search films"
            aria-label="Search films"
            className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-velvet-ink placeholder:text-velvet-ink/60 focus:border-white/50 focus:outline-none"
          />
        </form>
        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          {viewer ? (
            <>
              <LogButton className="btn bg-velvet-ink px-3.5 py-1.5 text-sm text-velvet hover:brightness-95" label="Log a film" />
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center rounded-full [&::-webkit-details-marker]:hidden" aria-label="Your account">
                  <Avatar user={viewer} size={34} link={false} />
                </summary>
                <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-lg border border-rule bg-surface py-1 text-sm text-ink shadow-xl">
                  <p className="border-b border-rule px-4 py-2 text-muted">
                    Signed in as <span className="font-semibold text-ink">{viewer.username}</span>
                  </p>
                  {[
                    [`/u/${viewer.username}`, "Profile"],
                    [`/u/${viewer.username}/diary`, "Diary"],
                    [`/u/${viewer.username}/watchlist`, "Watchlist"],
                    [`/u/${viewer.username}/lists`, "Lists"],
                    [`/u/${viewer.username}/stats`, "Stats"],
                    ["/settings", "Settings"],
                    ["/settings/import", "Import from Letterboxd"],
                  ].map(([href, label]) => (
                    <Link key={href} href={href} className="block px-4 py-2 hover:bg-paper">
                      {label}
                    </Link>
                  ))}
                  <form action={logout} className="border-t border-rule">
                    <button className="w-full px-4 py-2 text-left hover:bg-paper">Sign out</button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold opacity-85 hover:opacity-100">
                Sign in
              </Link>
              <Link href="/signup" className="btn bg-velvet-ink px-3.5 py-1.5 text-sm text-velvet">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-rule">
      <div className="wrap flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-start sm:justify-between">
        <p>
          <span className="display text-base italic text-ink">{SITE_NAME}</span> is open source.{" "}
          <Link href="/about" className="link">
            About and credits
          </Link>
        </p>
        <p className="max-w-md sm:text-right">
          Film data and images from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}
