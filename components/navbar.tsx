'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, Wallet, LogOut, Home, ShoppingBag, CreditCard, Package, Menu, X, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function Navbar() {
    const [balance, setBalance] = useState<number | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [ign, setIgn] = useState<string | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        fetchWalletInfo()
    }, [])

    const fetchWalletInfo = async () => {
        try {
            const res = await fetch('/api/wallet/info')
            if (res.ok) {
                const data = await res.json()
                setBalance(data.balance)
                setUserEmail(data.email)
                setIgn(data.minecraftIgn)
            }
        } catch (error) {
            console.error('Failed to fetch wallet info', error)
        }
    }

    const handleLogout = async () => {
        window.location.href = '/api/auth/signout'
    }

    const navItems = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/store', label: 'Store', icon: ShoppingBag },
        { href: '/orders', label: 'Orders', icon: Package },
        { href: '/wallet', label: 'Wallet', icon: CreditCard },
    ]

    return (
        <header className="border-b border-purple-500/10 bg-[#0a0a0f]/60 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/logo.jpg"
                            alt="Logo"
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-lg object-contain"
                        />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                            PRIMEX ANARCHY
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300",
                                        isActive
                                            ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                                            : "text-zinc-400 hover:text-purple-300 hover:bg-white/5"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Hamburger */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>

                <div className="hidden md:flex items-center gap-4">
                    {balance !== null ? (
                        <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full border border-zinc-700">
                                <Wallet className="h-4 w-4 text-purple-400" />
                                <span className="font-mono font-medium">₹{balance.toFixed(2)}</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-zinc-800">
                                {ign && (
                                    <Image
                                        src={`https://mc-heads.net/avatar/${ign}/32`}
                                        alt={ign}
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 rounded-lg border border-zinc-700"
                                    />
                                )}
                                <span className="text-xs text-zinc-500 max-w-[100px] truncate">{userEmail}</span>
                            </div>
                            <div className="flex bg-zinc-800 rounded-lg border border-zinc-700">
                                <Link
                                    href="/profile"
                                    className="p-2 hover:bg-zinc-700 rounded-l-lg transition-colors border-r border-zinc-700"
                                    title="Profile"
                                >
                                    <User className="h-4 w-4 text-zinc-400" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 hover:bg-zinc-700 rounded-r-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="h-4 w-4 text-zinc-400" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {
                mobileMenuOpen && (
                    <div className="md:hidden border-t border-purple-500/10 bg-[#0a0a0f]/95 backdrop-blur-xl absolute top-16 left-0 right-0 p-4 animate-in slide-in-from-top-4 duration-200 shadow-[0_15px_30px_rgba(0,0,0,0.8)] h-[calc(100vh-4rem)] z-40">
                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium transition-all duration-300",
                                            isActive
                                                ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                                                : "text-zinc-400 hover:text-purple-300 hover:bg-white/5"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                )
                            })}

                            {/* Mobile User Section */}
                            <div className="mt-8 pt-8 border-t border-zinc-800">
                                {balance !== null ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {ign && (
                                                <Image
                                                    src={`https://mc-heads.net/avatar/${ign}/48`}
                                                    alt={ign}
                                                    width={48}
                                                    height={48}
                                                    className="h-12 w-12 rounded-xl border border-zinc-700"
                                                />
                                            )}
                                            <div>
                                                <div className="text-white font-bold text-lg">{ign}</div>
                                                <div className="text-zinc-500 text-sm">{userEmail}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                            <span className="text-zinc-400">Balance</span>
                                            <div className="flex items-center gap-2">
                                                <Wallet className="h-4 w-4 text-purple-400" />
                                                <span className="font-mono text-xl font-bold text-white">₹{balance.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                                        >
                                            <LogOut className="h-5 w-5" />
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full flex items-center justify-center p-4 bg-white text-black font-bold rounded-xl"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                )
            }
        </header>
    )
}
