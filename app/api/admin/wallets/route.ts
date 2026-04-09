import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { authenticator } from 'otplib'

export const dynamic = 'force-dynamic'


export async function GET(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            include: {
                wallet: true
            }
        })

        // Filter out users who haven't set up a wallet yet (though they should have one by default if logic exists, usually created on register. 
        // If not, we might want to create one or just return nulls. 
        // Based on schema, wallet is optional relation on User, but let's assume valid users for now)

        return NextResponse.json(users)

    } catch (error) {
        console.error("Admin wallets error:", error)
        return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2FA Verification for Critical Action
        const requestingAdmin = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (requestingAdmin?.twoFactorEnabled && requestingAdmin.twoFactorSecret) {
            const twoFactorCode = req.headers.get('x-2fa-code')

            if (!twoFactorCode) {
                return NextResponse.json(
                    { error: "2FA_REQUIRED", message: "Two-factor authentication required" },
                    { status: 403 }
                )
            }

            const isValid = authenticator.check(twoFactorCode, requestingAdmin.twoFactorSecret)
            if (!isValid) {
                return NextResponse.json(
                    { error: "INVALID_2FA", message: "Invalid 2FA code" },
                    { status: 403 }
                )
            }
        }

        const { action, userId, amount, description } = await req.json()

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true }
        })

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        // Ensure wallet exists
        if (!user.wallet) {
            // Lazy create if missing
            await prisma.wallet.create({
                data: { userId: user.id }
            })
            // Refetch
            return POST(req) // Recurse once? Or just handle it. Let's just create and proceed.
            // Actually, better to just create it here if we want robust code, but for now assuming existence or basic error.
            // Let's create it to be safe.
        }

        const walletId = user.wallet ? user.wallet.id : (await prisma.wallet.create({ data: { userId: user.id } })).id

        if (action === 'ADJUST') {
            if (typeof amount !== 'number') return NextResponse.json({ error: "Invalid amount" }, { status: 400 })

            await prisma.$transaction([
                prisma.wallet.update({
                    where: { id: walletId },
                    data: { balance: { increment: amount } }
                }),
                prisma.walletTransaction.create({
                    data: {
                        walletId: walletId,
                        amount: Math.abs(amount),
                        type: 'ADJUSTMENT',
                        status: 'COMPLETED',
                        description: description || (amount > 0 ? 'Admin Deposit' : 'Admin Deduction')
                    }
                }),
                prisma.adminLog.create({
                    data: {
                        adminId: session.user.id!,
                        action: amount > 0 ? `ADDED_FUNDS_${amount}` : `DEDUCTED_FUNDS_${Math.abs(amount)}`,
                        targetId: userId,
                        ipHash: 'SYSTEM'
                    }
                })
            ])

            return NextResponse.json({ success: true, message: "Balance updated" })

        } else if (action === 'TOGGLE_STATUS') {
            const newStatus = user.wallet?.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE'

            await prisma.wallet.update({
                where: { id: walletId },
                data: { status: newStatus }
            })

            return NextResponse.json({ success: true, message: `Wallet ${newStatus}` })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    } catch (error) {
        console.error("Wallet update error:", error)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}
