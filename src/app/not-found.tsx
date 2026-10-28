import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap max-w-xl py-20 text-center">
      <p className="display text-7xl text-muted">404</p>
      <h1 className="display mt-4 text-3xl">This page isn&apos;t showing</h1>
      <p className="mt-2 text-muted">The link may be wrong, or the film, list or member may have been removed.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Go home
        </Link>
        <Link href="/films" className="btn btn-quiet">
          Search films
        </Link>
      </div>
    </div>
  );
}
