'use client'

import { useState } from 'react'
import { Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function AdminVerifyPage() {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            })

            const data = await res.json()

            if (res.ok) {
                toast.success("Access Granted")
                router.push('/admin')
                router.refresh()
            } else {
                setError(data.error || "Invalid Passcode")
            }
        } catch (err) {
            setError("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

                <div className="text-center mb-8">
                    <ShieldCheck className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Admin Verification</h1>
                    <p className="text-zinc-400 mt-2">Enter the master security code to proceed.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="sr-only">Passcode</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <input
                                type="password"
                                placeholder="Enter Security Code"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center text-red-500 text-sm bg-red-500/10 p-3 rounded border border-red-500/20">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {error}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin h-5 w-5" />}
                        {loading ? "Verifying..." : "Unlock Dashboard"}
                    </button>
                </form>
            </div>
        </div>
    )
}
