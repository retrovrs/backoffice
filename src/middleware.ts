import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

/**
 * Edge-level gate for the authenticated areas of the backoffice.
 *
 * This is a fast pre-filter, not the security boundary: it only checks for the
 * presence of a session cookie and never decodes or trusts its contents. Real
 * enforcement (authentication *and* role) lives in the server actions and route
 * handlers via `@/lib/auth-guards`, which resolve the session and the role from
 * the database on every privileged call.
 */
export function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
        const signInUrl = new URL('/signin', request.url)
        // Preserve where the user was heading so they can be sent back after login.
        signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
        return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/blog-posts/:path*',
        '/users/:path*',
        '/admin/:path*'
    ]
}
