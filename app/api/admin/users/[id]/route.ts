import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'


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
        const { password, role, minecraftIgn } = await req.json()
        const data: any = {}

        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10)
        }
        if (role) {
            data.role = role
        }
        if (minecraftIgn !== undefined) {
            // Check uniqueness if changing
            if (minecraftIgn) {
                const existing = await prisma.user.findUnique({ where: { minecraftIgn } })
                if (existing && existing.id !== id) {
                    return NextResponse.json({ error: "IGN already taken" }, { status: 409 })
                }
                data.minecraftIgn = minecraftIgn
            } else {
                data.minecraftIgn = null
            }
        }

        await prisma.user.update({
            where: { id },
            data
        })

        return NextResponse.json({ success: true, message: "User updated successfully" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}

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

        // Transactional delete to ensure cleanup
        await prisma.$transaction(async (tx) => {
            // Delete related data manually if not handled by Cascade
            // Note: Wallet has Cascade in schema.
            // Payments, Orders, AdminLogs need attention or we verify schema behavior.
            // Based on typical Prisma usage, it's safer to delete dependents first if no cascade exists.

            await tx.payment.deleteMany({ where: { userId: id } })
            await tx.order.deleteMany({ where: { userId: id } })
            await tx.adminLog.deleteMany({ where: { adminId: id } }) // Remove logs created BY this user (if they were admin)

            // finally delete user (Wallet is cascading)
            await tx.user.delete({ where: { id } })
        })

        return NextResponse.json({ success: true, message: "User deleted successfully" })
    } catch (error) {
        console.error("Delete user error:", error)
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}
