import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'


export async function GET(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const limit = searchParams.get('limit')
        const take = limit ? parseInt(limit) : 50

        const logs = await prisma.rconLog.findMany({
            orderBy: { createdAt: 'desc' },
            take,
            include: {
                order: {
                    include: {
                        user: { select: { email: true, minecraftIgn: true } },
                        product: { select: { name: true } }
                    }
                }
            }
        })

        return NextResponse.json(logs)
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
