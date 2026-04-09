import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { rcon } from "@/lib/rcon"

export const dynamic = 'force-dynamic'


export async function GET(req: Request) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const status = await rcon.testAllConnections()
        return NextResponse.json(status)
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
