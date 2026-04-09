import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { rcon } from "@/lib/rcon"
import { prisma } from "@/lib/prisma"
import { authenticator } from 'otplib'

export const dynamic = 'force-dynamic'


export async function POST(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2FA Verification for Critical Action (RCON)
        const requestingAdmin = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (requestingAdmin?.twoFactorEnabled && requestingAdmin.twoFactorSecret) {
            const twoFactorCode = req.headers.get('x-2fa-code')

            if (!twoFactorCode) {
                return NextResponse.json(
                    { error: "2FA_REQUIRED", message: "Two-factor authentication required" },
                    { status: 403 }
                )
            }

            const isValid = authenticator.check(twoFactorCode, requestingAdmin.twoFactorSecret)
            if (!isValid) {
                return NextResponse.json(
                    { error: "INVALID_2FA", message: "Invalid 2FA code" },
                    { status: 403 }
                )
            }
        }

        const { host, port, password, command, serverIdentifier } = await req.json()

        if (!command) {
            return NextResponse.json({ error: "Command is required" }, { status: 400 })
        }

        let result;

        // If connection details are provided, use dynamic execution (Manual Connection tab)
        // But we currently don't have a specific "executeDynamicWithLog", so we might want to log it manually or add support.
        // For simplicity, if params are provided, we use dynamic and log it.
        // If NOT provided, we use the system configured one (which logs automatically).

        if (host && port && password) {
            // Manual Dynamic Connection
            result = await rcon.executeDynamic(host, parseInt(port), password, command)

            // Log manually since dynamic doesn't auto-log
            try {
                await prisma.rconLog.create({
                    data: {
                        command,
                        response: result.success ? result.response : null,
                        status: result.success ? 'SENT' : 'FAILED',
                        source: 'MANUAL_DYNAMIC',
                        performedBy: session.user.email,
                        metadata: JSON.stringify({
                            targetHost: host,
                            targetPort: port,
                            userAgent: req.headers.get('user-agent'),
                            ip: req.headers.get('x-forwarded-for') || 'unknown'
                        })
                    }
                })
            } catch (e) { console.error("Log failed", e) }

        } else {
            // System Connection (uses DB settings)
            const metadata = {
                userAgent: req.headers.get('user-agent'),
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                timestamp: new Date().toISOString()
            }
            // @ts-ignore - Metadata arg might be missing in older client types
            result = await rcon.executeWithLog(command, 'MANUAL', session.user.email || 'Admin', undefined, metadata, serverIdentifier)
        }

        if (result.success) {
            return NextResponse.json({ success: true, response: result.response })
        } else {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

    } catch (error: any) {
        console.error("[API] RCON Internal Error:", error)
        return NextResponse.json({ error: "Internal Error: " + error.message }, { status: 500 })
    }
}
