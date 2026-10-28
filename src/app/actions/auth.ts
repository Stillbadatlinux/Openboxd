"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { passwordSchema, usernameSchema, type FormState } from "@/lib/validation";

const signupSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: passwordSchema,
});

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return /^\/(?![\/\\])/.test(n) ? n : "/";
}

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { username, email, password } = parsed.data;

  const clash = await db.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (clash) {
    return { error: clash.username === username ? "That username is taken." : "An account with that email already exists. Sign in instead." };
  }

  await db.user.create({
    data: { username, email, passwordHash: await bcrypt.hash(password, 12) },
  });

  await signIn("credentials", { login: username, password, redirectTo: "/welcome" });
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      login: formData.get("login"),
      password: formData.get("password"),
      redirectTo: safeNext(formData.get("next")),
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: "That username or password doesn't match. Check both and try again." };
    throw err; // the success redirect is thrown, too
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
