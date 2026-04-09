'use client'

import { useState, useEffect } from 'react'
import { User, Search, Key, Shield, Wallet, Loader2, Edit, X, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface UserData {
    id: string
    email: string
    minecraftIgn: string | null
    role: string
    lastLogin: string | null
    createdAt: string
    wallet: {
        balance: number
        status: string
    } | null
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [editingUser, setEditingUser] = useState<UserData | null>(null)
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('')
    const [ign, setIgn] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                setUsers(await res.json())
            }
        } catch {
            toast.error('Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (userId: string) => {
        setProcessing(true) // Global processing state to prevent navigation/actions
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('User deleted successfully')
                fetchUsers()
            } else {
                toast.error('Failed to delete user')
            }
        } catch {
            toast.error('Error deleting user')
        } finally {
            setProcessing(false)
        }
    }

    const handleUpdate = async () => {
        if (!editingUser) return
        setProcessing(true)

        try {
            const payload: any = {}
            if (password) payload.password = password
            if (role && role !== editingUser.role) payload.role = role
            if (ign !== editingUser.minecraftIgn) payload.minecraftIgn = ign

            if (Object.keys(payload).length === 0) {
                toast.info('No changes to save')
                setProcessing(false)
                return
            }

            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success('User updated')
                setEditingUser(null)
                setPassword('')
                fetchUsers()
            } else {
                toast.error('Update failed')
            }
        } catch {
            toast.error('Error updating user')
        } finally {
            setProcessing(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.minecraftIgn && u.minecraftIgn.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <User className="h-6 w-6 text-blue-500" />
                    User Management
                </h1>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm"
                        placeholder="Search users..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-800/50 text-zinc-400">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Last Login</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-zinc-800/20">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{user.minecraftIgn || 'No IGN'}</div>
                                        <div className="text-xs text-zinc-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-yellow-500">
                                        ₹{user.wallet?.balance || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.lastLogin ? (
                                                <>
                                                    <div className={`h-2.5 w-2.5 rounded-full ${new Date(user.lastLogin).getTime() > Date.now() - 1000 * 60 * 10 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                                                        new Date(user.lastLogin).getTime() > Date.now() - 1000 * 60 * 60 * 24 ? 'bg-yellow-500' :
                                                            'bg-zinc-600'
                                                        }`} title={new Date(user.lastLogin).toLocaleString()} />
                                                    <span className="text-zinc-400">
                                                        {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                                                    <span className="text-zinc-600">Never</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                        <button
                                            onClick={() => {
                                                setEditingUser(user)
                                                setRole(user.role)
                                                setIgn(user.minecraftIgn || '')
                                            }}
                                            className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition"
                                            title="Edit User"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this user? This action CANNOT be undone.")) {
                                                    // Trigger delete
                                                    handleDelete(user.id)
                                                }
                                            }}
                                            className="text-red-500/50 hover:text-red-500 p-1 hover:bg-red-500/10 rounded transition"
                                            title="Delete User"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Edit User</h3>
                            <button onClick={() => setEditingUser(null)}><X className="h-5 w-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Role</label>
                                <select
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="MODERATOR">Moderator</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Minecraft IGN</label>
                                <input
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                    value={ign}
                                    onChange={e => setIgn(e.target.value)}
                                    placeholder="Enter IGN"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">New Password (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        placeholder="Set new password"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white placeholder-zinc-600"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <div className="p-2 bg-zinc-800 rounded border border-zinc-700 text-zinc-400 flex items-center justify-center">
                                        <Key className="h-4 w-4" />
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">Leave blank to keep current password.</p>
                            </div>

                            <button
                                onClick={handleUpdate}
                                disabled={processing}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded mt-4 transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
