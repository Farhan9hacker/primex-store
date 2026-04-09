'use client'

import { useState, useEffect } from 'react'
import { Loader2, Package, ShoppingBag, Clock, CheckCircle, XCircle } from 'lucide-react'
import Navbar from '@/components/navbar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Order {
    id: string
    amount: number
    status: string
    serverMode: string
    createdAt: string
    product: {
        name: string
        type: string
    }
    delivery: {
        status: string
        command: string
    } | null
}

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/user/orders')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setOrders(data)
        } catch {
            toast.error('Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID':
            case 'DELIVERED': return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'FAILED': return <XCircle className="h-5 w-5 text-red-500" />
            default: return <Clock className="h-5 w-5 text-yellow-500" />
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <ShoppingBag className="h-8 w-8 text-purple-500" />
                    Order History
                </h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-white">No orders yet</h3>
                        <p>Your purchase history will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 w-full">
                                    <div className="h-12 w-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                                        <Package className="h-6 w-6 text-zinc-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{order.product.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                            <span className="font-mono text-xs">{order.id.slice(-8)}</span>
                                            <span>•</span>
                                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="text-purple-400">{order.serverMode}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <div className="font-bold text-xl">₹{order.amount}</div>
                                        <div className="text-xs text-zinc-500">Price</div>
                                    </div>

                                    <div className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border",
                                        order.status === 'DELIVERED' || order.status === 'PAID'
                                            ? "border-green-500/20 bg-green-500/10 text-green-500"
                                            : "border-zinc-700 bg-zinc-800 text-zinc-400"
                                    )}>
                                        {getStatusIcon(order.status)}
                                        {order.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
