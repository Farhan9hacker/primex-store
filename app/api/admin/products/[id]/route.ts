import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'


export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        await prisma.product.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete product error:", error)
        return NextResponse.json({ error: "Error deleting product" }, { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const data = await req.json()

        const product = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                price: parseFloat(data.price),
                originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
                type: data.type,
                category: data.category,
                serverMode: data.serverMode,
                deliveryCommand: data.deliveryCommand,
                imageUrl: data.imageUrl,
                isPermanent: data.isPermanent,
                stock: data.stock ? parseInt(data.stock) : null,
                isFeatured: data.isFeatured,
                isEnabled: data.isEnabled,
                discordRoleId: data.discordRoleId || null
            }
        })

        return NextResponse.json(product)
    } catch (error) {
        console.error("Update product error:", error)
        return NextResponse.json({ error: "Error updating product" }, { status: 500 })
    }
}
