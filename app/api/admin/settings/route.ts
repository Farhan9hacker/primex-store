import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['theme', 'SITE_BANNER_TEXT', 'SITE_BANNER_ENABLED'] }
            }
        })
        
        const map = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {} as Record<string, string>)
        
        return NextResponse.json({ 
            theme: map['theme'] || 'DEFAULT',
            bannerText: map['SITE_BANNER_TEXT'] || '',
            bannerEnabled: map['SITE_BANNER_ENABLED'] === 'true'
        })
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

        const body = await req.json()

        const promises = []
        
        if (body.theme !== undefined) {
            promises.push(prisma.systemSetting.upsert({
                where: { key: 'theme' },
                create: { key: 'theme', value: body.theme },
                update: { value: body.theme }
            }))
        }
        
        if (body.bannerText !== undefined) {
            promises.push(prisma.systemSetting.upsert({
                where: { key: 'SITE_BANNER_TEXT' },
                create: { key: 'SITE_BANNER_TEXT', value: body.bannerText },
                update: { value: body.bannerText }
            }))
        }
        
        if (body.bannerEnabled !== undefined) {
            const val = body.bannerEnabled ? 'true' : 'false'
            promises.push(prisma.systemSetting.upsert({
                where: { key: 'SITE_BANNER_ENABLED' },
                create: { key: 'SITE_BANNER_ENABLED', value: val },
                update: { value: val }
            }))
        }

        await prisma.$transaction(promises)

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: "Error saving settings" }, { status: 500 })
    }
}
