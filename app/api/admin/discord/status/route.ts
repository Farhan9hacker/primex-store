import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'DISCORD_BOT_TOKEN' }
        })

        const token = setting?.value

        if (!token) {
            return NextResponse.json({ success: false, error: "Token not configured" })
        }

        // Verify with Discord API
        const res = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                Authorization: `Bot ${token}`
            }
        })

        if (!res.ok) {
            return NextResponse.json({ success: false, error: "Invalid Token" })
        }

        const data = await res.json()
        return NextResponse.json({
            success: true,
            username: data.username,
            discriminator: data.discriminator,
            id: data.id
        })

    } catch (error) {
        return NextResponse.json({ success: false, error: "Connection Error" })
    }
}
