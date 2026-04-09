import { prisma } from "@/lib/prisma"
import { DollarSign, Clock, ShoppingCart, Users, TrendingUp, Package } from "lucide-react"
import { RevenueChart, PopularProductsChart } from "@/components/admin-charts"

async function getStats() {
    try {
        const totalRevenue = await prisma.walletTransaction.aggregate({
            where: { type: 'DEPOSIT', status: 'APPROVED' },
            _sum: { amount: true }
        })

        const pendingPayments = await prisma.payment.count({
            where: { status: 'PENDING' }
        })

        const failedPayments = await prisma.payment.count({
            where: { status: 'REJECTED' }
        })

        const currentRevenue = await prisma.walletTransaction.aggregate({
            where: {
                type: 'DEPOSIT',
                status: 'APPROVED',
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            },
            _sum: { amount: true }
        })

        const totalUsers = await prisma.user.count()

        const recentPurchases = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: true, product: true }
        })

        // Chart 1: Revenue over last 7 days
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - i)
            d.setHours(0, 0, 0, 0)
            return d
        }).reverse()

        const chartData = await Promise.all(last7Days.map(async (date) => {
            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)
            
            const revenue = await prisma.walletTransaction.aggregate({
                where: {
                    type: 'DEPOSIT',
                    status: 'APPROVED',
                    createdAt: { gte: date, lt: nextDate }
                },
                _sum: { amount: true }
            })
            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue: revenue._sum.amount || 0
            }
        }))

        // Chart 2: Popular Products (Sales)
        const productsSales = await prisma.order.groupBy({
            by: ['productId'],
            where: { status: 'DELIVERED' },
            _count: { productId: true },
            orderBy: { _count: { productId: 'desc' } },
            take: 5
        })

        const popProducts = await Promise.all(productsSales.map(async (p) => {
            const prod = await prisma.product.findUnique({ where: { id: p.productId }, select: { name: true } })
            return {
                name: prod?.name || 'Unknown',
                value: p._count.productId
            }
        }))

        let onlinePlayers = 0
        try {
            const mcRes = await fetch('https://api.mcsrvstat.us/2/play.primexanarchy.net', { next: { revalidate: 60 } })
            const mcData = await mcRes.json()
            if (mcData.online) {
                onlinePlayers = mcData.players.online
            }
        } catch (e) {
            console.error('Failed to fetch MC status', e)
        }

        let discordBot = { success: false, username: '', error: '' }
        try {
            const setting = await prisma.systemSetting.findUnique({ where: { key: 'DISCORD_BOT_TOKEN' } })
            if (setting?.value) {
                const res = await fetch('https://discord.com/api/v10/users/@me', {
                    headers: { Authorization: `Bot ${setting.value}` },
                    next: { revalidate: 60 }
                })
                if (res.ok) {
                    const data = await res.json()
                    discordBot = { success: true, username: data.username, error: '' }
                } else {
                    discordBot = { success: false, username: '', error: 'Invalid Token' }
                }
            }
        } catch (e) { console.error('Discord Check Failed', e) }


        return {
            revenue: totalRevenue._sum.amount || 0,
            todayRevenue: currentRevenue._sum.amount || 0,
            pending: pendingPayments,
            failed: failedPayments,
            users: totalUsers,
            chartData,
            popProducts,
            onlinePlayers,
            recent: recentPurchases,
            discordBot
        }
    } catch (e) {
        console.error('Admin stats error:', e)
        return { revenue: 0, todayRevenue: 0, pending: 0, failed: 0, users: 0, chartData: [], popProducts: [], onlinePlayers: 0, recent: [], discordBot: { success: false, username: '', error: 'Error' } }
    }
}

export default async function AdminDashboard() {
    const stats = await getStats()

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-400">Total Revenue</h3>
                        <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold">₹{stats.revenue.toLocaleString()}</div>
                    <div className="text-sm text-zinc-500 mt-2">Today: ₹{stats.todayRevenue}</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-400">Total Users</h3>
                        <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold">{stats.users}</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-400">Online Players</h3>
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500 blur-sm opacity-50 rounded-full animate-pulse" />
                            <div className="h-3 w-3 bg-green-500 rounded-full relative" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.onlinePlayers}</div>
                    <div className="text-sm text-zinc-500 mt-2">play.primexanarchy.net</div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-400">Discord Bot</h3>
                        <div className={`relative ${stats.discordBot.success ? 'text-indigo-500' : 'text-red-500'}`}>
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                        </div>
                    </div>
                    <div className="text-3xl font-bold truncate">
                        {stats.discordBot.success ? stats.discordBot.username : 'Offline'}
                    </div>
                    <div className={`text-sm mt-2 ${stats.discordBot.success ? 'text-zinc-500' : 'text-red-400'}`}>
                        {stats.discordBot.success ? 'Connected' : (stats.discordBot.error || 'Not Configured')}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-purple-400" />
                        Revenue (7 Days)
                    </h3>
                    <RevenueChart data={stats.chartData} />
                </div>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <Package className="h-5 w-5 text-blue-400" />
                        Top Sellers
                    </h3>
                    <PopularProductsChart data={stats.popProducts} />
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6">
                <h3 className="text-xl font-bold mb-4">Recent Purchases</h3>
                {stats.recent.length === 0 ? (
                    <div className="text-zinc-500">No recent activity.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="text-zinc-400 border-b border-zinc-800 text-xs uppercase">
                            <tr>
                                <th className="pb-3">User</th>
                                <th className="pb-3">Product</th>
                                <th className="pb-3">Amount</th>
                                <th className="pb-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {stats.recent.map((order: any) => (
                                <tr key={order.id}>
                                    <td className="py-3 text-white">{order.user.email}</td>
                                    <td className="py-3 text-purple-400">{order.product.name}</td>
                                    <td className="py-3">₹{order.amount}</td>
                                    <td className="py-3 text-zinc-500 text-sm">{order.createdAt.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

