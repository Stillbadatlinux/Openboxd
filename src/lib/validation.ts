import { z } from "zod";

const RESERVED = new Set([
  "admin", "api", "film", "films", "list", "lists", "login", "logout", "signup", "settings",
  "review", "reviews", "u", "about", "help", "members", "search", "activity", "new", "welcome",
]);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{2,20}$/, "Usernames are 2–20 characters: letters, numbers and underscores.")
  .refine((u) => !RESERVED.has(u), "That username is reserved. Pick another.");

export const passwordSchema = z.string().min(8, "Passwords need at least 8 characters.").max(200);

export type FormState = { error?: string; ok?: boolean; message?: string } | undefined;
