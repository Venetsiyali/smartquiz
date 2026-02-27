import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Adapter } from "next-auth/adapters";
import { sendWelcomeEmail } from "./mailer";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as Adapter,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                otp: { label: "OTP", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password || !credentials?.otp) {
                    throw new Error("Ma'lumotlar to'liq emas");
                }

                // Verify OTP First
                const verificationToken = await prisma.verificationToken.findFirst({
                    where: {
                        identifier: credentials.email,
                        token: credentials.otp,
                        expires: { gt: new Date() }
                    }
                });

                if (!verificationToken) {
                    throw new Error("Kod noto'g'ri yoki uning muddati tugagan");
                }

                // Verify User
                let user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (user) {
                    if (!user.password) {
                        throw new Error("Bu hisob Google orqali ochilgan. Google bilan kiring.");
                    }
                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    if (!isValid) throw new Error("Noto'g'ri parol");
                } else {
                    const hashedPassword = await bcrypt.hash(credentials.password, 10);
                    user = await prisma.user.create({
                        data: {
                            email: credentials.email,
                            password: hashedPassword,
                            name: credentials.email.split("@")[0],
                        }
                    });
                }

                // Cleanup
                await prisma.verificationToken.deleteMany({
                    where: { identifier: credentials.email }
                });

                return user;
            }
        }),
    ],
    events: {
        async createUser({ user }) {
            // Send welcome email upon registration
            if (user.email && user.name) {
                await sendWelcomeEmail(user.email, user.name);
            }
        }
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.role = user.role || "STUDENT";
                // @ts-ignore
                token.plan = user.plan || "FREE";

                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLogin: new Date() },
                });
            }
            if (trigger === "update" && session) {
                token.role = session.role;
                token.plan = session.plan;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.plan = token.plan as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
