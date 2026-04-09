import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { code } = await req.json()

        // In a real app, use environment variable: process.env.ADMIN_SECURE_CODE
        const VALID_CODE = "PRIMEX@1341"

        if (code === VALID_CODE) {
            // Set cookie valid for 24 hours
            (await cookies()).set('admin_gate_unlocked', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24,
                path: '/'
            })

            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ error: "Invalid Security Code" }, { status: 400 })
        }

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
