import { prisma as db } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const status = formData.get('status')
        const order_id = formData.get('order_id') as string // This matches our payment.id if we passed it correctly
        const amount = formData.get('amount')
        // const customer_mobile = formData.get('customer_mobile')
        // const remark1 = formData.get('remark1')

        console.log("Webhook received:", { status, order_id, amount })

        if (!order_id) {
            return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
        }

        const payment = await db.payment.findUnique({
            where: { id: order_id },
            include: { user: true }
        })

        if (!payment) {
            console.error("Payment not found for order_id:", order_id)
            return NextResponse.json({ error: "Payment not found" }, { status: 404 })
        }

        if (payment.status === "APPROVED") {
            return NextResponse.json({ message: "Already processed" })
        }

        if (status === "success") {
            // Update Payment Status
            await db.payment.update({
                where: { id: order_id },
                data: {
                    status: "APPROVED",
                    reviewedBy: "SYSTEM",
                    reviewedAt: new Date(),
                    // Update gatewayOrderId if not already set or if different? 
                    // Usually we set it at creation or updated it then.
                }
            })

            // Update User Wallet
            await db.wallet.update({
                where: { userId: payment.userId },
                data: {
                    balance: { increment: payment.amount }
                }
            })

            // Create Wallet Transaction Log
            await db.walletTransaction.create({
                data: {
                    walletId: (await db.wallet.findUnique({ where: { userId: payment.userId } }))!.id,
                    amount: payment.amount,
                    type: "DEPOSIT",
                    status: "COMPLETED",
                    description: `PayIN Deposit (${order_id})`
                }
            })

            return NextResponse.json({ status: true, message: "Transaction Successfully Processed" })

        } else if (status === "failure" || status === "failed") {
            await db.payment.update({
                where: { id: order_id },
                data: {
                    status: "REJECTED",
                    reviewedBy: "SYSTEM",
                    reviewedAt: new Date()
                }
            })
            return NextResponse.json({ status: true, message: "Transaction Marked as Failed" })
        }

        return NextResponse.json({ status: true, message: "Webhook received" })

    } catch (error) {
        console.error("Webhook Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
