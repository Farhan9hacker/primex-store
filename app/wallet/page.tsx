'use client'

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Wallet, History, CreditCard, Check, ChevronRight, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import QRCode from "react-qr-code"
import { toast } from "sonner"
import Navbar from '@/components/navbar'

interface Transaction {
    id: string
    amount: number
    type: string
    status: string
    createdAt: string
    description?: string
}

import { Suspense } from 'react'

function WalletContent() {
    const [balance, setBalance] = useState(0)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [amount, setAmount] = useState('')
    const [utr, setUtr] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount')

    const [latestOrderId, setLatestOrderId] = useState<string | null>(null)
    const [verifying, setVerifying] = useState(false)
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        fetchWallet()
    }, [])

    const verifyPayment = async () => {
        if (!latestOrderId) return
        setVerifying(true)
        try {
            const res = await fetch('/api/payment/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: latestOrderId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Funds added successfully! Redirecting...')
                setLatestOrderId(null)
                setStep('amount')
                fetchWallet()

                // Redirect to store after short delay
                setTimeout(() => {
                    window.location.href = 'https://store.primexanarchy.net/'
                }, 1500)

            } else {
                toast.info('Payment pending or not found yet. Try again in 30s.')
            }
        } catch {
            toast.error('Error verifying payment')
        } finally {
            setVerifying(false)
        }
    }

    const fetchWallet = async () => {
        try {
            const res = await fetch('/api/wallet/info')
            const data = await res.json()
            if (data.balance !== undefined) {
                setBalance(data.balance)
                setTransactions(data.transactions || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            })

            const data = await res.json()
            if (res.ok && data.success && data.payment_url) {
                setLatestOrderId(data.order_id) // We need backend to return the created order ID!
                // Open in new tab or redirect?
                // If we redirect, we need to persist orderId in localstorage or URL param to check on return.
                // Assuming opens in same tab, user presses back? or Gateway redirects back to /wallet?
                // Let's assume gateway redirects back. We should check if we can save something.
                // For now, let's open in new window so they stay here to verify? No, typical flow is redirect.

                // Save to localStorage
                if (data.order_id) localStorage.setItem('pending_payment_id', data.order_id)

                window.location.href = data.payment_url
            } else {
                toast.error(data.error || 'Failed to initiate payment')
                setSubmitting(false)
            }
        } catch (e) {
            console.error("Payment error:", e)
            toast.error('Error connecting to payment server. Check console.')
            setSubmitting(false)
        }
    }

    // Check on mount if we have a pending payment
    // Check on mount if we have a pending payment or URL param
    useEffect(() => {
        const verifyParam = searchParams.get('verify')
        const pending = localStorage.getItem('pending_payment_id')

        if (verifyParam === 'true' && pending) {
            setLatestOrderId(pending)
            // Auto trigger verification
            const timer = setTimeout(() => {
                verifyPayment()
            }, 1000)
            return () => clearTimeout(timer)
        } else if (pending) {
            setLatestOrderId(pending)
        }
    }, [searchParams])

    // Effect to trigger verifyPayment when latestOrderId is set AND verify param is present (handled above mostly, but good to be sure)
    useEffect(() => {
        if (latestOrderId && searchParams.get('verify') === 'true' && !verifying) {
            verifyPayment()
        }
    }, [latestOrderId, searchParams])


    // Primex Anarchy UPI ID
    const upiId = "primexanarchy@ptyes"
    const upiUrl = `upi://pay?pa=${upiId}&pn=PrimexAnarchy&am=${amount}&cu=INR`

    if (loading) return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex items-center justify-center flex-1">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">My Wallet</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Balance Card */}
                    <div className="col-span-1 bg-gradient-to-br from-purple-900/50 to-zinc-900 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet className="h-32 w-32" />
                        </div>
                        <h2 className="text-zinc-400 font-medium">Available Balance</h2>
                        <div className="text-4xl font-bold mt-2 text-white">₹{balance.toFixed(2)}</div>
                        <p className="text-xs text-zinc-500 mt-4">Funds are non-refundable once used.</p>
                    </div>

                    {/* Add Funds Section */}
                    <div className="col-span-1 md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-purple-500" />
                            Add Funds (UPI)
                        </h2>

                        <div className="relative">
                            {/* Step 1: Amount */}
                            {step === 'amount' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-2">Amount to Add (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 500"
                                            className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-4 text-white text-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={() => amount && parseFloat(amount) > 0 && setStep('payment')}
                                        disabled={!amount || parseFloat(amount) <= 0}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                                    >
                                        Continue to Payment <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Payment (PayIN) */}
                            {step === 'payment' && (
                                <form onSubmit={handleDeposit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 bg-white p-6 rounded-xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                                            {/* Payment App Icons Badge */}
                                            <div className="absolute top-0 right-0 left-0 bg-blue-50/80 backdrop-blur-sm p-2 flex justify-center gap-4 border-b border-blue-100">
                                                <span className="text-[10px] font-bold text-blue-800 flex items-center gap-1"><span className="h-2 w-2 bg-blue-600 rounded-full"></span>UPI</span>
                                                <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1"><span className="h-2 w-2 bg-blue-400 rounded-full"></span>Paytm</span>
                                                <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1"><span className="h-2 w-2 bg-orange-500 rounded-full"></span>FamPay</span>
                                            </div>

                                            <div className="mt-12 mb-6 p-4 bg-blue-50 rounded-full">
                                                <CreditCard className="h-16 w-16 text-blue-600" />
                                            </div>

                                            <div className="text-center mb-4">
                                                <p className="text-black font-bold text-xl">Pay ₹{amount}</p>
                                                <p className="text-zinc-500 text-sm mt-1">Secure Payment via PayIN</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-200">
                                                1. Click <strong>Pay Now</strong> below.<br />
                                                2. You will be redirected to the secure payment gateway.<br />
                                                3. Complete the payment using UPI, Card, or Netbanking.<br />
                                                4. Funds will be added automatically.
                                            </div>

                                            <div className="text-xs text-zinc-500 space-y-2 px-2">
                                                <p>
                                                    By proceeding, you agree to our <span className="text-zinc-400 font-bold">Terms & Conditions</span>:
                                                </p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    <li>
                                                        If you are <span className="text-red-400 font-bold">under 18</span>, you must have parental guidance and permission to make this purchase.
                                                    </li>
                                                    <li>
                                                        We have a strict <span className="text-red-400 font-bold">NO REFUND</span> policy. All sales are final.
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="flex gap-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setStep('amount')}
                                                    className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 disabled:opacity-50 transition flex items-center justify-center gap-2"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <RefreshCw className="h-5 w-5 animate-spin" /> Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="h-5 w-5" /> Pay Now
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* Step 3 removed or unused since we redirect */}
                        </div>
                    </div>
                </div>

                {/* Transactions */}
                <div className="mt-12">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <History className="h-5 w-5 text-zinc-500" />
                        Recent Activity
                    </h3>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                        {transactions.length === 0 ? (
                            <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                                <History className="h-12 w-12 mb-4 opacity-20" />
                                No transactions yet. Add funds to get started!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase border-b border-zinc-800">
                                        <tr>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">{tx.type}</td>
                                                <td className={cn("px-6 py-4 font-mono font-bold", tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400')}>
                                                    {tx.type === 'DEPOSIT' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400 text-sm">
                                                    {new Date(tx.createdAt).toLocaleDateString()} <span className="text-zinc-600 text-xs">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold border",
                                                        tx.status === 'APPROVED' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                            tx.status === 'PENDING' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                                "bg-zinc-800 text-zinc-400 border-zinc-700"
                                                    )}>
                                                        {tx.status || 'COMPLETED'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function WalletPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        }>
            <WalletContent />
        </Suspense>
    )
}
