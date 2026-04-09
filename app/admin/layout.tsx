import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, ShoppingBag, Terminal, Users, Wallet, CreditCard, Package, Shield, Lock as LockIcon } from 'lucide-react'
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // 1. Basic Session Check
    if (!session?.user?.email) {
        redirect("/")
    }

    // 2. Real-time Database Role Check
    // We must fetch from DB because session role might be stale if just changed
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true }
    })

    if (!user || user.role !== "ADMIN") {
        console.log(`[AdminAccess] Denied access to user: ${session.user.email} (Real Role: ${user?.role})`)
        redirect("/")
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex flex-col">
                <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
                    <Shield className="h-6 w-6 text-purple-500" />
                    <span className="font-bold text-lg">Admin Panel</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>

                    <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                        <ShoppingBag className="h-5 w-5" />
                        Products
                    </Link>
                    <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                        <Package className="h-5 w-5" />
                        Orders
                    </Link>
                    <Link href="/admin/rcon" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                        <Terminal className="h-5 w-5" />
                        RCON Console
                    </Link>
                    <Link href="/admin/wallets" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                        <Wallet className="h-5 w-5" />
                        Wallets
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                        <Users className="h-5 w-5" />
                        Users
                    </Link>
                    <Link href="/admin/logs" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                        <Shield className="h-5 w-5" />
                        Logs
                    </Link>
                    <Link href="/admin/security" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
                        <LockIcon className="h-5 w-5" />
                        Security
                    </Link>
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <div className="text-xs text-zinc-500">Logged in as</div>
                    <div className="text-sm font-medium text-white truncate">{session.user.email}</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-black p-8 overflow-auto">
                {children}
            </main>
        </div>
    )
}
