import { envConfig } from '@/lib/config/env';
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get("host") || "";
    const pathname = request.nextUrl.pathname;



    // Handle www to non-www redirect (Canonical enforcement)
    if (hostname.startsWith("www.scripthub.id")) {
        const redirectUrl = new URL(`https://scripthub.id${pathname}`);
        return NextResponse.redirect(redirectUrl, 301);
    }

    // Handle legacy getkey subdomain with a 301 Permanent Redirect
    if (hostname.startsWith("getkey.")) {
        const redirectUrl = new URL(`https://getfreekey.scripthub.id${pathname}`);
        return NextResponse.redirect(redirectUrl, 301);
    }

    // Handle getfreekey subdomain (Production & Localhost)
    if (hostname.startsWith("getfreekey.")) {
        if (
            pathname.startsWith("/_next") ||
            pathname.startsWith("/api") ||
            pathname.includes(".")
        ) {
            return NextResponse.next();
        }

        const rewritePath = pathname === "/" ? "/getfreekey" : `/getfreekey${pathname}`;
        const url = request.nextUrl.clone();
        url.pathname = rewritePath;
        return NextResponse.rewrite(url);
    }

    // ── Protected route guards ───────────────────────────────────────
    // Backend sets cookies with domain=.scripthub.id so they're visible here.
    // Users with old cookies (pre-fix) need to re-login once.

    const isStudioRoute = pathname.startsWith("/studio");
    const isAdminRoute = pathname.startsWith("/admin");

    if (isStudioRoute || isAdminRoute) {
        const accessToken = request.cookies.get("accessToken")?.value;

        if (!accessToken) {
            return NextResponse.redirect(new URL("/home", request.url));
        }

        try {
            const backendUrl = envConfig.apiBaseUrl;
            const fetchUrl = backendUrl.endsWith("/api") ? `${backendUrl}/auth/me` : `${backendUrl}/api/auth/me`;

            console.log(`[MIDDLEWARE] Checking admin access at ${fetchUrl}`);

            const res = await fetch(fetchUrl, {
                headers: { Cookie: `accessToken=${accessToken}` },
            });

            if (!res.ok) {
                console.log(`[MIDDLEWARE] Admin check failed: ${res.status} ${res.statusText}`);
                return NextResponse.redirect(new URL("/home", request.url));
            }

            const data = await res.json();
            const roles: string[] = data?.data?.user?.roles || [];
            console.log(`[MIDDLEWARE] User roles:`, roles);

            if (!roles.includes("admin") && !roles.includes("moderator")) {
                console.log(`[MIDDLEWARE] Access denied: User is not admin/moderator`);
                return NextResponse.redirect(new URL("/home", request.url));
            }
        } catch (err) {
            console.log(`[MIDDLEWARE] Admin check error:`, err);
            return NextResponse.redirect(new URL("/home", request.url));
        }
    }
    // ─────────────────────────────────────────────────────────────────

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files and Next.js internals
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
