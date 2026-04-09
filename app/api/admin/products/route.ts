import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'


export async function POST(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await req.json()

        // Create product
        const product = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                originalPrice: data.originalPrice,
                type: data.type,
                category: data.category,
                serverMode: data.serverMode,
                deliveryCommand: data.deliveryCommand,
                imageUrl: data.imageUrl,
                isPermanent: data.isPermanent,
                stock: data.stock ? parseInt(data.stock) : null,
                isFeatured: data.isFeatured || false,
                isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
                discordRoleId: data.discordRoleId || null
            }
        })

        return NextResponse.json(product)

    } catch {
        return NextResponse.json({ error: "Error" }, { status: 500 })
    }
}
