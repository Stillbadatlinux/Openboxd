"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap max-w-xl py-20 text-center">
      <h1 className="display text-3xl">Something went wrong loading this page</h1>
      <p className="mt-2 text-muted">It may be a temporary problem with the database or film data. Try again in a moment.</p>
      <button onClick={reset} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
