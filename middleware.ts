import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    // Protect dashboard, teacher routes, and specific game instances (not the main lobby/join screens if they don't require auth)
    // Re-adjust matcher as needed for your app. The prompt mentioned /dashboard and barcha /play/[gameId] sahifalar
    matcher: [
        "/dashboard/:path*",
        "/play/:gameId", // Protects dynamic game routes (assuming format /play/123)
    ],
};
