import { auth } from "@/auth"
import { prisma } from "@/lib/prisma" // Use correct prisma instance
import { NextResponse } from "next/server"

// Dynamically import the SDK or similar approach if needed, 
// but since it's a class in a file, we can try to import it if it exports properly.
// The file CheckOrderStatusSDK.ts has "class CheckOrderStatusSDK ..." but doesn't seem to verify exports perfectly for Next.js API routes without "export default" or we can rewrite the logic here.
// Actually, I'll copy the logic to ensure it works without import issues or just use axios directly as per SDK logic.
import axios from 'axios'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { order_id } = await req.json()

        if (!order_id) {
            return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
        }

        const payment = await prisma.payment.findUnique({
            where: { id: order_id }
        })

        if (!payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 })
        }

        if (payment.status === "APPROVED") {
            return NextResponse.json({ success: true, message: "Payment already approved" })
        }

        // Check status with PayIN
        const userToken = "07425ebf8a7d5ce54914312dbc075c98"
        const baseUrl = 'https://pay0.shop'

        console.log("Checking status for:", order_id)

        const response = await axios.post(`${baseUrl}/api/check-order-status`, {
            user_token: userToken,
            order_id: order_id
        }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })

        const data = response.data
        console.log("Check Status Response:", data)

        if (data.status === true && data.result?.txnStatus === "SUCCESS") {
            // Update Payment Status
            await prisma.payment.update({
                where: { id: order_id },
                data: {
                    status: "APPROVED",
                    reviewedBy: "SYSTEM_CHECK",
                    reviewedAt: new Date(),
                    gatewayOrderId: data.result.orderId // Upstream order ID
                }
            })

            // Update User Wallet
            await prisma.wallet.upsert({
                where: { userId: payment.userId },
                create: {
                    userId: payment.userId,
                    balance: payment.amount,
                    status: "ACTIVE"
                },
                update: {
                    balance: { increment: payment.amount }
                }
            })

            // Create Transaction Log
            const wallet = await prisma.wallet.findUnique({ where: { userId: payment.userId } })
            if (wallet) {
                await prisma.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: payment.amount,
                        type: "DEPOSIT",
                        status: "COMPLETED",
                        description: `PayIN Deposit (${order_id})`
                    }
                })
            }

            return NextResponse.json({ success: true, message: "Payment Verified & Added" })
        }

        return NextResponse.json({ success: false, message: "Payment Pending or Failed" })

    } catch (error) {
        console.error("Check Status Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
