import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const { email, password, minecraftIgn } = await req.json()

        if (!email || !password || !minecraftIgn) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
        }

        // Check if user exists (Email or IGN)
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { minecraftIgn }
                ]
            }
        })

        if (existing) {
            return NextResponse.json({ error: "Email or Minecraft IGN already registered" }, { status: 409 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user and wallet transactionally
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    minecraftIgn,
                    role: 'USER'
                }
            })

            // Create wallet
            await tx.wallet.create({
                data: { userId: user.id }
            })
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
