import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            plan: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role?: string;
        plan?: string;
    }
}
