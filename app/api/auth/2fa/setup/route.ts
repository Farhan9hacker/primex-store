import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        if (user.twoFactorEnabled) {
            return NextResponse.json({ enabled: true })
        }

        // Generate Secret
        const secret = authenticator.generateSecret()
        const otpauth = authenticator.keyuri(user.email, 'Primex Anarchy', secret)
        const qr = await QRCode.toDataURL(otpauth)

        // Save secret temporarily (or permanently but disabled)
        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorSecret: secret }
        })

        return NextResponse.json({ enabled: false, secret, qr })

    } catch (error) {
        console.error("2FA Generate Error:", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { code } = await req.json()

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user || !user.twoFactorSecret) {
            return NextResponse.json({ error: "Setup not initialized" }, { status: 400 })
        }

        const isValid = authenticator.check(code, user.twoFactorSecret)

        if (isValid) {
            await prisma.user.update({
                where: { id: user.id },
                data: { twoFactorEnabled: true }
            })
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ error: "Invalid Code" }, { status: 400 })
        }

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
