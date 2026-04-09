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

        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: [
                        'RCON_HOST', 'RCON_PORT', 'RCON_PASSWORD',
                        'RCON_HOST_2', 'RCON_PORT_2', 'RCON_PASSWORD_2', 'RCON_MODE_2',
                        'RCON_HOST_3', 'RCON_PORT_3', 'RCON_PASSWORD_3', 'RCON_MODE_3',
                        'DISCORD_WEBHOOK_URL', 'DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID'
                    ]
                }
            }
        })

        const config: any = {}
        settings.forEach(s => config[s.key] = s.value)

        return NextResponse.json({
            host: config.RCON_HOST || '',
            port: config.RCON_PORT || '25575',
            password: config.RCON_PASSWORD || '',

            host2: config.RCON_HOST_2 || '',
            port2: config.RCON_PORT_2 || '',
            password2: config.RCON_PASSWORD_2 || '',
            mode2: config.RCON_MODE_2 || '',

            host3: config.RCON_HOST_3 || '',
            port3: config.RCON_PORT_3 || '',
            password3: config.RCON_PASSWORD_3 || '',
            mode3: config.RCON_MODE_3 || '',

            webhookUrl: config.DISCORD_WEBHOOK_URL || '',
            botToken: config.DISCORD_BOT_TOKEN || '',
            guildId: config.DISCORD_GUILD_ID || ''
        })

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await req.json()
        const {
            host, port, password,
            host2, port2, password2, mode2,
            host3, port3, password3, mode3,
            webhookUrl, botToken, guildId
        } = data

        const updates = [
            prisma.systemSetting.upsert({ where: { key: 'RCON_HOST' }, update: { value: host }, create: { key: 'RCON_HOST', value: host } }),
            prisma.systemSetting.upsert({ where: { key: 'RCON_PORT' }, update: { value: port }, create: { key: 'RCON_PORT', value: port } }),
            prisma.systemSetting.upsert({ where: { key: 'RCON_PASSWORD' }, update: { value: password }, create: { key: 'RCON_PASSWORD', value: password } }),

            prisma.systemSetting.upsert({ where: { key: 'RCON_HOST_2' }, update: { value: host2 || '' }, create: { key: 'RCON_HOST_2', value: host2 || '' } }),
            prisma.systemSetting.upsert({ where: { key: 'RCON_PORT_2' }, update: { value: port2 || '' }, create: { key: 'RCON_PORT_2', value: port2 || '' } }),
            prisma.systemSetting.upsert({ where: { key: 'RCON_PASSWORD_2' }, update: { value: password2 || '' }, create: { key: 'RCON_PASSWORD_2', value: password2 || '' } }),
            prisma.systemSetting.upsert({ where: { key: 'RCON_MODE_2' }, update: { value: mode2 || '' }, create: { key: 'RCON_MODE_2', value: mode2 || '' } }),

            prisma.systemSetting.upsert({ where: { key: 'RCON_HOST_3' }, update: { value: host3 || '' }, create: { key: 'RCON_HOST_3', value: host3 || '' } }),
            prisma.systemSetting.upsert({ where: { key: 'RCON_PORT_3' }, update: { value: port3 || '' }, create: { key: 'RCON_PORT_3', value: port3 || '' } }),
            prisma.systemSetting.upsert({ where: { key: 'RCON_PASSWORD_3' }, update: { value: password3 || '' }, create: { key: 'RCON_PASSWORD_3', value: password3 || '' } }),
            prisma.systemSetting.upsert({ where: { key: 'RCON_MODE_3' }, update: { value: mode3 || '' }, create: { key: 'RCON_MODE_3', value: mode3 || '' } }),

            prisma.systemSetting.upsert({ where: { key: 'DISCORD_WEBHOOK_URL' }, update: { value: webhookUrl }, create: { key: 'DISCORD_WEBHOOK_URL', value: webhookUrl } }),
            prisma.systemSetting.upsert({ where: { key: 'DISCORD_BOT_TOKEN' }, update: { value: botToken }, create: { key: 'DISCORD_BOT_TOKEN', value: botToken } }),
            prisma.systemSetting.upsert({ where: { key: 'DISCORD_GUILD_ID' }, update: { value: guildId }, create: { key: 'DISCORD_GUILD_ID', value: guildId } })
        ]

        await prisma.$transaction(updates)

        // Log Admin Setting Change
        await prisma.adminLog.create({
            data: {
                adminId: session.user.id!,
                action: "UPDATED_SETTINGS",
                ipHash: "SYSTEM", // Ideally we get IP from headers
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        return NextResponse.json({ error: "Internal Error: " }, { status: 500 })
    }
}
