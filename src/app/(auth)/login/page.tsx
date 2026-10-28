import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getViewer()) redirect(next && /^\/(?![\/\\])/.test(next) ? next : "/");
  return (
    <>
      <h1 className="display mb-6 text-4xl">Sign in</h1>
      <LoginForm next={next} />
    </>
  );
}
