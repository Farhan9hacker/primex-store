import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        let userId = session.user.id

        // Validation: Verify if the user actually exists with this ID
        // This handles cases where session.id might be a Discord ID but DB expects a CUID
        let dbUser = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!dbUser && session.user.email) {
            console.log("Wallet Info: User not found by ID, trying email...", session.user.email)
            dbUser = await prisma.user.findUnique({
                where: { email: session.user.email }
            })
            if (dbUser) {
                userId = dbUser.id
            }
        }

        if (!dbUser) {
            return NextResponse.json({ error: "User record not found" }, { status: 404 })
        }

        const wallet = await prisma.wallet.findUnique({
            where: { userId: userId },
            include: {
                user: {
                    select: {
                        email: true,
                        minecraftIgn: true
                    }
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        })

        if (!wallet) {
            // Create wallet if not exists (should have been done on signup but safe fallback)
            const newWallet = await prisma.wallet.create({
                data: { userId: userId }
            })
            return NextResponse.json(newWallet)
        }

        return NextResponse.json({
            ...wallet,
            email: wallet.user.email,
            minecraftIgn: wallet.user.minecraftIgn
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
