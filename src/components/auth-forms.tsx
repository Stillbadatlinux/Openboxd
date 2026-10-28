"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? "/"} />
      <div>
        <label className="label" htmlFor="login">
          Username or email
        </label>
        <input id="login" name="login" className="field" autoComplete="username" required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" className="field" autoComplete="current-password" required />
      </div>
      {state?.error && <p role="alert" className="text-sm text-heart">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="link">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div>
        <label className="label" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          className="field"
          autoComplete="username"
          required
          pattern="[A-Za-z0-9_]{2,20}"
          title="2–20 characters: letters, numbers and underscores"
          autoFocus
        />
        <p className="mt-1 text-xs text-muted">Your profile lives at /u/username. You can change it later.</p>
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" className="field" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" minLength={8} className="field" autoComplete="new-password" required />
        <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
      </div>
      {state?.error && <p role="alert" className="text-sm text-heart">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    </form>
  );
}
