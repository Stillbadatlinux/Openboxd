import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="wrap max-w-2xl py-12">
      <h1 className="display mb-6 text-4xl">About {SITE_NAME}</h1>
      <div className="grid gap-4 text-[1.05rem] leading-relaxed">
        <p>
          {SITE_NAME} is an open-source social film diary. Members log the films they watch, rate and review them, keep a
          watchlist, make lists and follow each other.
        </p>
        <p>
          Anyone can run their own copy: the code, setup guide and issue tracker are on GitHub. Contributions are welcome.
        </p>
        <h2 className="display mt-6 text-2xl">Credits</h2>
        <p>
          Film titles, posters, cast and crew come from <a className="link" href="https://www.themoviedb.org/">The Movie Database (TMDB)</a>.
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p>
          {SITE_NAME} isn&apos;t affiliated with Letterboxd. The import tool reads the export files Letterboxd gives its
          members so they can bring their own data with them.
        </p>
      </div>
    </div>
  );
}
