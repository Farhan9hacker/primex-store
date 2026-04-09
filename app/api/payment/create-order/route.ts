import { auth } from "@/auth"
import { prisma as db } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { amount, customer_mobile, customer_name } = body

        if (!amount || amount < 1) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }

        // 1. Create a Pending Payment record in DB
        // We use the payment ID as the order_id for PayIN to track it easily
        const payment = await db.payment.create({
            data: {
                userId: session.user.id,
                amount: parseFloat(amount),
                utr: `PAYIN_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Temporary unique string
                status: "PENDING",
                // description: "Wallet Deposit via PayIN" 
            }
        })

        // 2. Use SDK for PayIN
        const userToken = "07425ebf8a7d5ce54914312dbc075c98"

        // Dynamically get the base URL using Origin header (most reliable for client requests)
        // Fallback to Referer or configured URL if needed
        const origin = req.headers.get("origin")
        const referer = req.headers.get("referer")

        let baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'https://store.primexanarchy.net'

        // If origin is missing but referer exists, try to extract origin from referer
        if (!origin && referer) {
            try {
                const url = new URL(referer)
                baseUrl = url.origin
            } catch (e) {
                // ignore invalid referer
            }
        }

        // Import class (dynamic import or assuming file is available)
        // Since it's in root, we might need to move it or use relative path
        const { default: CreateOrderSDK } = await import('@/CreateOrderSDK')
        const payIn = new CreateOrderSDK()

        console.log("Using SDK with Token:", userToken)

        const payload = {
            customer_mobile: customer_mobile || '9999999999',
            // customer_name is not in SDK interface, skipping or adding if SDK allows partial match? 
            // SDK interface is strict in TS usually, but axios sends whatever is in object.
            // Let's stick to the interface defined in SDK for now.
            user_token: userToken,
            amount: amount.toString(),
            order_id: payment.id,
            redirect_url: `${baseUrl}/wallet?verify=true`,
            remark1: 'Wallet Deposit',
            remark2: session.user.id
        }

        console.log("SDK Payload:", payload)
        const data = await payIn.createOrder(payload)
        console.log("PayIN SDK Response:", data)

        if (data.status === true) {
            // Update payment with gateway order id if provided (example response says orderId, result.orderId)
            // But we sent our payment.id as order_id, so they might return it back or a new one.
            // valid response: { status: true, result: { orderId: "...", payment_url: "..." } }

            await db.payment.update({
                where: { id: payment.id },
                data: {
                    gatewayOrderId: data.result?.orderId
                }
            })

            return NextResponse.json({
                success: true,
                payment_url: data.result?.payment_url,
                order_id: payment.id
            })
        } else {
            // Mark payment as FAILED if API call failed
            await db.payment.update({
                where: { id: payment.id },
                data: { status: "REJECTED" } // or FAILED if we had that status
            })

            return NextResponse.json({ error: data.message || "Payment Gateway Error" }, { status: 400 })
        }

    } catch (error) {
        console.error("Payment Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
