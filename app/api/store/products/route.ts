import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get('category')

        // Build where clause
        const where: any = { isEnabled: true }
        if (category && category !== 'All') {
            where.category = category // Case sensitive matching for now
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { price: 'asc' }
        })

        return NextResponse.json(products)
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
