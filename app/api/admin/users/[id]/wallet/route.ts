import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        })

        if (!admin || admin.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const body = await req.json()
        const { amount, action } = body // action: 'ADD' | 'REMOVE'
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: resolvedParams.id },
            include: { wallet: true }
        })

        if (!targetUser || !targetUser.wallet) {
            return NextResponse.json({ error: "User or wallet not found" }, { status: 404 })
        }

        let newBalance = targetUser.wallet.balance
        if (action === 'ADD') {
            newBalance += amount
        } else if (action === 'REMOVE') {
            newBalance -= amount
            if (newBalance < 0) newBalance = 0
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        await prisma.$transaction([
            prisma.wallet.update({
                where: { id: targetUser.wallet.id },
                data: { balance: newBalance }
            }),
            prisma.walletTransaction.create({
                data: {
                    walletId: targetUser.wallet.id,
                    amount: action === 'REMOVE' ? -amount : amount,
                    type: 'DEPOSIT', // Mapping to exist prisma type
                    status: 'APPROVED',
                    description: `Admin Adjustment (${action})`
                }
            }),
            prisma.adminLog.create({
                data: {
                    adminId: admin.id,
                    action: 'UPDATED_WALLET',
                    targetId: targetUser.id,
                    details: `${action} ${amount}. New balance: ${newBalance}`,
                    ipHash: 'internal'
                }
            })
        ])

        return NextResponse.json({ success: true, newBalance })
    } catch (error) {
        console.error("Wallet modified error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
