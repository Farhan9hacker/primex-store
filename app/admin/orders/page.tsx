'use client'

import { useState, useEffect } from 'react'

import { Loader2, Search, Package, User, Calendar, Monitor, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

interface Order {
    id: string
    amount: number
    status: string
    serverMode: string
    createdAt: string
    user: {
        email: string
        minecraftIgn: string | null
    }
    product: {
        name: string
    }
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setOrders(data)
        } catch {
            toast.error('Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(filter.toLowerCase()) ||
        order.user.email.toLowerCase().includes(filter.toLowerCase()) ||
        (order.user.minecraftIgn && order.user.minecraftIgn.toLowerCase().includes(filter.toLowerCase()))
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'text-green-400 bg-green-400/10'
            case 'DELIVERED': return 'text-blue-400 bg-blue-400/10'
            case 'FAILED': return 'text-red-400 bg-red-400/10'
            case 'REFUNDED': return 'text-orange-400 bg-orange-400/10'
            default: return 'text-zinc-400 bg-zinc-400/10'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="h-6 w-6 text-purple-500" />
                    Orders
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search ID, Email, IGN..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors w-64"
                    />
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-800/50 text-zinc-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Mode</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" />
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-zinc-500">{order.id.slice(-8)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-zinc-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-white">{order.user.minecraftIgn || 'N/A'}</span>
                                                    <span className="text-xs text-zinc-500">{order.user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-300">{order.product.name}</td>
                                        <td className="px-6 py-4 font-medium">₹{order.amount}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <Monitor className="h-3 w-3" />
                                                {order.serverMode}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
