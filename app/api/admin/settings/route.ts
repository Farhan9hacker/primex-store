import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'theme' }
        })
        return NextResponse.json({ theme: setting?.value || 'DEFAULT' })
    } catch {
        return NextResponse.json({ error: "Error fetching settings" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { theme } = await req.json()

        await prisma.systemSetting.upsert({
            where: { key: 'theme' },
            create: { key: 'theme', value: theme },
            update: { value: theme }
        })

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: "Error saving settings" }, { status: 500 })
    }
}
