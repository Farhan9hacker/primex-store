'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
    id: string
    name: string
    description: string
    price: number | string
    originalPrice?: number | string | null
    type: string
    category: string
    serverMode: string
    deliveryCommand: string
    isPermanent: boolean
    imageUrl?: string | null
    stock?: number | null
    isFeatured?: boolean
    isEnabled?: boolean
    discordRoleId?: string | null
}

export default function ProductForm({ onClose, initialData }: { onClose: () => void, initialData?: Product | null }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        price: initialData?.price?.toString() || '',
        originalPrice: initialData?.originalPrice?.toString() || '',
        imageUrl: initialData?.imageUrl || '',
        type: initialData?.type || 'RANK',
        category: initialData?.category || 'Ranks',
        serverMode: initialData?.serverMode || 'ANARCHY',
        deliveryCommand: initialData?.deliveryCommand || '',
        isPermanent: initialData?.isPermanent ?? true,
        isFeatured: initialData?.isFeatured || false,
        isEnabled: initialData?.isEnabled ?? true,
        stock: initialData?.stock?.toString() || '',
        discordRoleId: initialData?.discordRoleId || ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = initialData
                ? `/api/admin/products/${initialData.id}`
                : '/api/admin/products'

            const method = initialData ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null
                })
            })

            if (res.ok) {
                toast.success(initialData ? 'Product updated' : 'Product created')
                router.refresh()
                onClose()
            } else {
                toast.error('Operation failed')
            }
        } catch {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 w-full max-w-2xl rounded-xl border border-zinc-800 p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{initialData ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose}><X className="h-6 w-6" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Product Name</label>
                            <input
                                required
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Offer Price (₹)</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Description</label>
                        <textarea
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 h-24"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Product Image</label>
                        <div className="flex gap-4 items-start">
                            {formData.imageUrl && (
                                <div className="relative w-24 h-24 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 shrink-0">
                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 p-1 rounded-full text-white transition"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                            <div className="flex-1">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Plus className="w-6 h-6 text-zinc-400 mb-2" />
                                        <p className="text-sm text-zinc-400">Click to upload image</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return

                                            // Clean filename
                                            const filename = file.name.replace(/[^a-zA-Z0-9.]/g, '')
                                            const uniqueFilename = `${Date.now()}-${filename}`

                                            const toastId = toast.loading('Uploading...')
                                            try {
                                                const res = await fetch(`/api/upload?filename=${encodeURIComponent(uniqueFilename)}`, {
                                                    method: 'POST',
                                                    body: file
                                                })
                                                const data = await res.json()

                                                if (res.ok) {
                                                    setFormData({ ...formData, imageUrl: data.url })
                                                    toast.dismiss(toastId)
                                                    toast.success('Image uploaded')
                                                } else {
                                                    toast.dismiss(toastId)
                                                    toast.error('Upload failed')
                                                }
                                            } catch {
                                                toast.dismiss(toastId)
                                                toast.error('Upload error')
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Type</label>
                            <select
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="RANK">Rank</option>
                                <option value="ITEM">Item</option>
                                <option value="COMMAND">Command</option>
                                <option value="BUNDLE">Bundle</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Category</label>
                            <select
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Ranks">Ranks</option>
                                <option value="Crates">Crates</option>
                                <option value="Keys">Keys</option>
                                <option value="Special Items">Special Items</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Server Mode</label>
                            <select
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2"
                                value={formData.serverMode}
                                onChange={e => setFormData({ ...formData, serverMode: e.target.value })}
                            >
                                <option value="ANARCHY">Anarchy</option>
                                <option value="CPVP">Crystal PvP</option>
                                <option value="LIFESTEAL">Lifesteal</option>
                                <option value="LOBBY">Lobby</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Stock (Optional)</label>
                            <input
                                type="number"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                placeholder="Unlimited"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="isFeatured"
                                checked={formData.isFeatured}
                                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="isFeatured" className="text-sm font-medium text-white">Featured</label>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="isEnabled"
                                checked={formData.isEnabled}
                                onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <label htmlFor="isEnabled" className="text-sm font-medium text-white">Enabled</label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Delivery Commands (One per line)</label>
                        <textarea
                            required
                            placeholder={`lp user {player} parent add vip\nsay Congratulations {player}!`}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 font-mono text-sm h-32"
                            value={formData.deliveryCommand}
                            onChange={e => setFormData({ ...formData, deliveryCommand: e.target.value })}
                        />
                        <p className="text-xs text-zinc-500 mt-1">Supports multiple commands. Use new line for each command.</p>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Discord Role ID (Optional)</label>
                        <input
                            placeholder="123456789012345678"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 font-mono text-sm"
                            value={formData.discordRoleId}
                            onChange={e => setFormData({ ...formData, discordRoleId: e.target.value })}
                        />
                        <p className="text-xs text-zinc-500 mt-1">Role to automatically assign upon purchase.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 text-white font-bold py-3 rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Product')}
                    </button>
                </form>
            </div>
        </div>
    )
}
