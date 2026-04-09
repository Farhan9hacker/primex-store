'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'

export default function PaymentActions({ id, utr }: { id: string, utr: string }) {
    const [loading, setLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [newUtr, setNewUtr] = useState(utr)
    const router = useRouter()

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!confirm(`Are you sure you want to ${action} this payment?`)) return
        setLoading(true)

        try {
            const res = await fetch('/api/admin/payment-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId: id, action })
            })

            if (res.ok) {
                router.refresh()
            } else {
                alert('Failed')
            }
        } catch {
            alert('Error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateUtr = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/payment-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId: id, action: 'UPDATE_UTR', utr: newUtr })
            })

            if (res.ok) {
                setIsEditing(false)
                router.refresh()
            } else {
                alert('Failed to update UTR')
            }
        } catch {
            alert('Error updating UTR')
        } finally {
            setLoading(false)
        }
    }

    if (isEditing) {
        return (
            <div className="flex gap-2 items-center">
                <input
                    className="bg-black/20 border border-zinc-700 rounded px-2 py-1 text-xs text-white w-32"
                    value={newUtr}
                    onChange={(e) => setNewUtr(e.target.value)}
                />
                <button
                    onClick={handleUpdateUtr}
                    disabled={loading}
                    className="p-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"
                >
                    <Check className="h-3 w-3" />
                </button>
                <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 text-zinc-500 hover:text-white"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        )
    }

    return (
        <div className="flex gap-2 items-center">
            <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-zinc-500 hover:text-purple-400 underline mr-2"
            >
                Edit ID
            </button>
            <button
                onClick={() => handleAction('APPROVE')}
                disabled={loading}
                className="p-2 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 disabled:opacity-50"
                title="Approve"
            >
                <Check className="h-4 w-4" />
            </button>
            <button
                onClick={() => handleAction('REJECT')}
                disabled={loading}
                className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 disabled:opacity-50"
                title="Reject"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
