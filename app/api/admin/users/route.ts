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

        const users = await prisma.user.findMany({
            include: { wallet: true },
            orderBy: { createdAt: 'desc' }
        })

        const formattedUsers = users.map(u => {
            const user = u as any
            return {
                id: user.id,
                email: user.email,
                minecraftIgn: user.minecraftIgn,
                role: user.role,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                wallet: user.wallet ? {
                    balance: user.wallet.balance,
                    status: user.wallet.status
                } : null
            }
        })

        return NextResponse.json(formattedUsers)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
