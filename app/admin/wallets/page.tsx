'use client'

import { useState, useEffect } from 'react'
import { Wallet, Search, TrendingUp, TrendingDown, Ban, CheckCircle, X, Loader2, User as UserIcon, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UserWithWallet {
    id: string
    email: string
    minecraftIgn: string | null
    wallet: {
        id: string
        balance: number
        status: string
    } | null
}

export default function AdminWalletsPage() {
    const [users, setUsers] = useState<UserWithWallet[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [selectedUser, setSelectedUser] = useState<UserWithWallet | null>(null)
    const [amount, setAmount] = useState('')
    const [processing, setProcessing] = useState(false)

    // 2FA State
    const [showTwoFactor, setShowTwoFactor] = useState(false)
    const [twoFactorCode, setTwoFactorCode] = useState('')
    const [pendingAction, setPendingAction] = useState<{ action: 'ADJUST' | 'TOGGLE_STATUS' } | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/wallets')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setUsers(data)
        } catch {
            toast.error('Failed to load wallets')
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(filter.toLowerCase()) ||
        (user.minecraftIgn && user.minecraftIgn.toLowerCase().includes(filter.toLowerCase()))
    )

    const handleAction = async (action: 'ADJUST' | 'TOGGLE_STATUS', code?: string) => {
        if (!selectedUser) return
        setProcessing(true)

        try {
            const payload = {
                action,
                userId: selectedUser.id,
                amount: action === 'ADJUST' ? parseFloat(amount) : undefined
            }

            const headers: any = { 'Content-Type': 'application/json' }
            if (code) {
                headers['x-2fa-code'] = code
            }

            const res = await fetch('/api/admin/wallets', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (res.status === 403 && data.error === '2FA_REQUIRED') {
                setPendingAction({ action })
                setShowTwoFactor(true)
                setProcessing(false) // Stop processing so we can type code
                return
            }

            if (res.ok) {
                toast.success(data.message)
                setSelectedUser(null)
                setAmount('')
                fetchUsers() // Refresh list
                setShowTwoFactor(false)
                setTwoFactorCode('')
                setPendingAction(null)
            } else {
                toast.error(data.error || 'Action failed')
            }
        } catch {
            toast.error('Something went wrong')
        } finally {
            if (!showTwoFactor) {
                setProcessing(false)
            }
        }
    }

    const submitTwoFactor = () => {
        if (!pendingAction) return
        handleAction(pendingAction.action, twoFactorCode)
    }

    return (
        <div className="space-y-6 relative min-h-screen">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-yellow-500" />
                    Wallets
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search Email, IGN..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-yellow-500 transition-colors w-64"
                    />
                </div>
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {loading ? (
                    <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" /></div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500">No users found.</div>
                ) : (
                    filteredUsers.map((user) => (
                        <div key={user.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="bg-zinc-800 p-2 rounded-lg">
                                        <UserIcon className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{user.minecraftIgn || 'N/A'}</div>
                                        <div className="text-xs text-zinc-500">{user.email}</div>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-[10px] font-bold",
                                    user.wallet?.status === 'FROZEN' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                )}>
                                    {user.wallet?.status || 'ACTIVE'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                                <div className="text-sm text-zinc-400">Balance</div>
                                <div className="font-mono font-bold text-yellow-400">₹{user.wallet?.balance || 0}</div>
                            </div>

                            <button
                                onClick={() => setSelectedUser(user)}
                                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition"
                            >
                                Manage Wallet
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-800/50 text-zinc-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" />
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-4 w-4 text-zinc-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-white">{user.minecraftIgn || 'N/A'}</span>
                                                    <span className="text-xs text-zinc-500">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-yellow-400">
                                            ₹{user.wallet?.balance || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-xs font-bold",
                                                user.wallet?.status === 'FROZEN' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                            )}>
                                                {user.wallet?.status || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="text-zinc-400 hover:text-white text-sm font-medium underline"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Wallet Management Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Manage Wallet</h2>
                            <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-6 p-4 bg-zinc-800/50 rounded-xl">
                            <UserIcon className="h-10 w-10 text-zinc-400 p-2 bg-zinc-800 rounded-full" />
                            <div>
                                <div className="font-bold">{selectedUser.minecraftIgn || 'No IGN'}</div>
                                <div className="text-sm text-zinc-400">{selectedUser.email}</div>
                                <div className="text-xs text-yellow-500 mt-1 font-mono">Current Balance: ₹{selectedUser.wallet?.balance || 0}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Adjust Balance</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Amount (+ / -)"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-2 focus:border-yellow-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => handleAction('ADJUST')}
                                        disabled={!amount || processing}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                                    >
                                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">Use negative values to deduct funds.</p>
                            </div>

                            <hr className="border-zinc-800" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold">Freeze Wallet</div>
                                    <div className="text-sm text-zinc-400">Prevent further transactions</div>
                                </div>
                                <button
                                    onClick={() => handleAction('TOGGLE_STATUS')}
                                    disabled={processing}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium border transition-colors",
                                        selectedUser.wallet?.status === 'FROZEN'
                                            ? "bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20"
                                            : "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20"
                                    )}
                                >
                                    {selectedUser.wallet?.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2FA Challenge Modal */}
            {showTwoFactor && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <div className="mx-auto w-12 h-12 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mb-3">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-bold">2FA Verification</h2>
                            <p className="text-sm text-zinc-400 mt-1">Please enter your 2FA code to authorize this action.</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-center text-xl tracking-widest font-mono focus:border-purple-500 focus:outline-none"
                                autoFocus
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowTwoFactor(false)
                                        setProcessing(false)
                                        setTwoFactorCode('')
                                    }}
                                    className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitTwoFactor}
                                    disabled={twoFactorCode.length !== 6 || processing}
                                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center"
                                >
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
