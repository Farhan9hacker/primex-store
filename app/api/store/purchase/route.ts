import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { discord } from "@/lib/discord"
import { rcon } from "@/lib/rcon"

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { productId, serverMode, ign } = await req.json()
        const userId = session.user.id
        const userEmail = session.user.email

        // 0. Validate Inputs
        if (!ign || ign.length < 3 || !/^[a-zA-Z0-9_.]+$/.test(ign)) {
            return NextResponse.json({ error: "Invalid IGN. Only letters, numbers, underscores, and dots allowed." }, { status: 400 })
        }

        // 1. Pre-Flight Checks (Online & Inventory)
        // Check if player is online
        const listRes = await rcon.execute('list', serverMode)
        if (!listRes.success) {
            return NextResponse.json({ error: "Server is offline or unreachable." }, { status: 503 })
        }

        // This is a simple check. Depending on server response format, this might need regex.
        // Standard vanilla: "There are 2 of 20 players online: Player1, Player2"
        if (!listRes.response.includes(ign)) {
            return NextResponse.json({ error: `Player ${ign} is not online. You must be online to receive items.` }, { status: 400 })
        }

        // Check Inventory Space (requires plugin support, e.g., 'invcheck <player>')
        // For now, we will assume this command exists or use a placeholder that always passes if no plugin.
        // PROPOSED LOGIC: We try to run the check. If the command fails (unknown command), we might skip or fail safe.
        // User requested: "invcheck {player}"
        const invCheckRes = await rcon.execute(`invcheck ${ign}`, serverMode)
        // Assumption: Plugin returns "Inventory Full" strings if full.
        if (invCheckRes.success && (invCheckRes.response.includes("Full") || invCheckRes.response.includes("no space"))) {
            return NextResponse.json({ error: "Your inventory is full. Please clear space and try again." }, { status: 400 })
        }

        // 2. Database Transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                include: { wallet: true }
            })

            const product = await tx.product.findUnique({
                where: { id: productId }
            })

            if (!product || !product.isEnabled) throw new Error("Product unavailable")
            if (!user || !user.wallet) throw new Error("Wallet not found")
            if (user.wallet.balance < product.price) throw new Error("Insufficient funds")

            // Deduct Balance
            await tx.wallet.update({
                where: { id: user.wallet.id },
                data: { balance: { decrement: product.price } }
            })

            // Log Transaction
            await tx.walletTransaction.create({
                data: {
                    walletId: user.wallet.id,
                    amount: product.price,
                    type: 'PURCHASE',
                    status: 'COMPLETED',
                    description: `Bought ${product.name}`
                }
            })

            // Create Order
            const order = await tx.order.create({
                data: {
                    userId: user.id,
                    productId: product.id,
                    amount: product.price,
                    status: 'PAID',
                    serverMode: serverMode || product.serverMode
                }
            })

            // Prepare Command (Handle multi-line)
            const cmd = product.deliveryCommand.replaceAll('{player}', ign)

            const delivery = await tx.deliveryQueue.create({
                data: {
                    orderId: order.id,
                    command: cmd,
                    status: 'PENDING'
                }
            })

            return { order, delivery, cmd, product, user, serverMode: serverMode || product.serverMode }
        })

        // 3. Execute Delivery
        if (result.cmd) {
            // Split into separate commands (newline separated)
            const commands = result.cmd.split('\n').map(c => c.trim()).filter(c => c.length > 0)
            let allSuccess = true
            let errors: string[] = []

            for (const commandLine of commands) {
                // Enhanced RCON Execution with Logging and Order ID
                const deliverRes = await rcon.executeWithLog(commandLine, 'DELIVERY', 'Auto-Delivery', result.order.id, undefined, result.serverMode)
                if (!deliverRes.success) {
                    allSuccess = false
                    errors.push(`cmd: ${commandLine} -> error: ${deliverRes.error}`)
                }
            }

            if (allSuccess) {
                await prisma.deliveryQueue.update({
                    where: { id: result.delivery.id },
                    data: { status: 'DELIVERED' }
                })

                // Notify Discord (Success)
                discord.sendOrderAlert({
                    userEmail: userEmail || 'Unknown',
                    product: result.product.name,
                    price: result.order.amount
                })

                // Assign Discord Role if applicable
                if (result.product.discordRoleId && result.user.discordId) {
                    await discord.assignRole(result.user.discordId, result.product.discordRoleId)
                }

            } else {
                await prisma.deliveryQueue.update({
                    where: { id: result.delivery.id },
                    data: { status: 'FAILED' }
                })
                // Notify Discord (Failed RCON)
                console.error("RCON Delivery Failed (Partial or Full):", errors.join(' | '))
            }
        }

        return NextResponse.json({ success: true, orderId: result.order.id })

    } catch (error: any) {
        console.error("Purchase error", error)
        return NextResponse.json({ error: error.message || "Purchase failed" }, { status: 400 })
    }
}
