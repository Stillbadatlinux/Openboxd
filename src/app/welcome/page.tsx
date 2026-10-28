import type { Metadata } from "next";
import Link from "next/link";
import { LogButton } from "@/components/log-dialog";
import { SITE_NAME } from "@/lib/site";
import { requireViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const viewer = await requireViewer("/welcome");
  return (
    <div className="wrap max-w-2xl py-14">
      <h1 className="display text-5xl">Welcome, {viewer.username}.</h1>
      <p className="mt-3 text-lg text-muted">Three ways to get your {SITE_NAME} started:</p>
      <ul className="mt-8 grid gap-6">
        <li className="border-l-2 border-velvet pl-5 dark:border-brass">
          <h2 className="display text-2xl">Log the last film you watched</h2>
          <p className="mb-3 text-muted">Add the date, a rating and, if you like, a few words.</p>
          <LogButton />
        </li>
        <li className="border-l-2 border-velvet pl-5 dark:border-brass">
          <h2 className="display text-2xl">Bring your history from Letterboxd</h2>
          <p className="mb-3 text-muted">Upload the CSV files from your Letterboxd data export.</p>
          <Link href="/settings/import" className="btn btn-quiet">
            Import your data
          </Link>
        </li>
        <li className="border-l-2 border-velvet pl-5 dark:border-brass">
          <h2 className="display text-2xl">Find people to follow</h2>
          <p className="mb-3 text-muted">Their diaries and reviews will fill your home page.</p>
          <Link href="/members" className="btn btn-quiet">
            Browse members
          </Link>
        </li>
      </ul>
    </div>
  );
}
