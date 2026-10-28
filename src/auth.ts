import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

class InvalidLogin extends CredentialsSignin {
  code = "invalid_login";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { login: {}, password: {} },
      async authorize(credentials) {
        const login = String(credentials?.login ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!login || !password) throw new InvalidLogin();
        const user = await db.user.findFirst({
          where: login.includes("@") ? { email: login } : { username: login },
        });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new InvalidLogin();
        return { id: user.id, name: user.username, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid;
      return session;
    },
  },
});
