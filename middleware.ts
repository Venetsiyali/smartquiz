import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized({ req, token }) {
            // Only allow ADMIN role on /admin paths
            if (req.nextUrl.pathname.startsWith("/admin")) {
                return token?.role === "ADMIN";
            }
            // For other protected routes just require any valid login
            return !!token;
        },
    },
    pages: {
        signIn: "/login",
    },
});

export const config = {
    // Protect dashboard, teacher routes, and specific game instances (not the main lobby/join screens if they don't require auth)
    matcher: [
        "/admin/:path*",
        "/dashboard/:path*",
        "/play/:gameId",
    ],
};
