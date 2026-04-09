import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnAdminPanel = req.nextUrl.pathname.startsWith('/admin')
    const isOnSecurityPage = req.nextUrl.pathname === '/admin/security'
    const isSetupApi = req.nextUrl.pathname.startsWith('/api/auth/2fa/setup')

    if (isOnAdminPanel) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', req.nextUrl))
        }

        // Check if user is ADMIN (Extra safety, layout also handles this)
        if (req.auth?.user?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', req.nextUrl))
        }

        // Admin Gate Check (Cookie)
        // We use a simplified check: If the user is admin, they MUST have the cookie to proceed
        // unless they are on the verify page.
        if (!req.nextUrl.pathname.startsWith('/admin/verify')) {
            const gateCookie = req.cookies.get('admin_gate_unlocked')

            if (!gateCookie || gateCookie.value !== 'true') {
                return NextResponse.redirect(new URL('/admin/verify', req.nextUrl))
            }
        }
    }
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
