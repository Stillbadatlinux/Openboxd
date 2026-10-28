import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth-forms";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getViewer()) redirect("/");
  return (
    <>
      <h1 className="display mb-2 text-4xl">Create an account</h1>
      <p className="mb-6 text-muted">Keep a diary of what you watch, rate and review films, and follow friends.</p>
      <SignupForm />
    </>
  );
}
