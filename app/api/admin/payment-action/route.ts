import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { discord } from "@/lib/discord"

export const dynamic = 'force-dynamic'


export async function POST(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { paymentId, action, utr } = await req.json()

        if (action === 'APPROVE') {
            const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
            if (!payment || payment.status !== 'PENDING') {
                return NextResponse.json({ error: "Invalid payment" }, { status: 400 })
            }

            // Transaction: Update payment status AND add to wallet info
            await prisma.$transaction([
                prisma.payment.update({
                    where: { id: paymentId },
                    data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: session.user.id }
                }),
                prisma.wallet.update({
                    where: { userId: payment.userId },
                    data: { balance: { increment: payment.amount } }
                }),
                prisma.walletTransaction.create({
                    data: {
                        walletId: (await prisma.wallet.findUnique({ where: { userId: payment.userId } }))!.id,
                        amount: payment.amount,
                        type: 'DEPOSIT',
                        status: 'APPROVED',
                        description: `UPI Deposit: ${payment.utr}`
                    }
                })
            ])

            // Send Discord Notification
            const user = await prisma.user.findUnique({ where: { id: payment.userId } })
            if (user && user.email) {
                try {
                    await discord.sendPaymentApproved({
                        userEmail: user.email,
                        amount: payment.amount,
                        utr: payment.utr
                    })
                } catch (discordError) {
                    console.error("Discord alert failed:", discordError)
                }
            }

        } else if (action === 'REJECT') {
            await prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: session.user.id }
            })
        } else if (action === 'UPDATE_UTR') {
            if (!utr) return NextResponse.json({ error: "UTR required" }, { status: 400 })

            await prisma.payment.update({
                where: { id: paymentId },
                data: { utr }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
