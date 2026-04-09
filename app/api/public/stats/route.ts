import { prisma as db } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Recent Buyers (last 10 approved payments)
        const recentBuyers = await db.payment.findMany({
            where: { status: "APPROVED" },
            orderBy: { createdAt: 'desc' },
            take: 4,
            include: {
                user: {
                    select: {
                        minecraftIgn: true
                    }
                }
            }
        })

        // Top Donators (aggregate sum)
        const topDonators = await db.payment.groupBy({
            by: ['userId'],
            where: { status: "APPROVED" },
            _sum: {
                amount: true
            },
            orderBy: {
                _sum: {
                    amount: 'desc'
                }
            },
            take: 5
        })

        // Fetch user details for top donators
        const topDonatorsWithDetails = await Promise.all(topDonators.map(async (entry) => {
            const user = await db.user.findUnique({
                where: { id: entry.userId },
                select: { minecraftIgn: true }
            })
            return {
                ...user,
                totalAmount: entry._sum.amount
            }
        }))

        return NextResponse.json({
            recentBuyers: recentBuyers.map(p => ({
                user: p.user.minecraftIgn || "Anonymous",
                amount: p.amount,
                date: p.createdAt
            })),
            topDonators: topDonatorsWithDetails.map(u => ({
                user: u.minecraftIgn || "Anonymous",
                amount: u.totalAmount
            }))
        })
    } catch (error) {
        console.error("Stats Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
