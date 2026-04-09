'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'
import ProductForm from './product-form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Client component wrapper
interface Product {
    id: string
    name: string
    description: string
    price: number | string
    type: string
    category: string
    serverMode: string
    deliveryCommand: string
    isPermanent: boolean
    isEnabled: boolean
    isFeatured: boolean
    stock: number | null
    createdAt: Date
    updatedAt: Date
}

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const router = useRouter()

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return

        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Product deleted')
                router.refresh()
            } else {
                toast.error('Failed to delete product')
            }
        } catch {
            toast.error('Error deleting product')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Products</h1>
                <button
                    onClick={() => {
                        setEditingProduct(null)
                        setShowForm(true)
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Add Product
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialProducts.map((p) => (
                    <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={() => {
                                    setEditingProduct(p)
                                    setShowForm(true)
                                }}
                                className="p-1 hover:text-white text-zinc-500"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(p.id, p.name)}
                                className="p-1 hover:text-red-500 text-zinc-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-xs uppercase font-bold text-purple-400">{p.serverMode}</span>
                            {p.isFeatured && <span className="text-xs uppercase font-bold text-yellow-400 bg-yellow-400/10 px-2 rounded">Featured</span>}
                            {!p.isEnabled && <span className="text-xs uppercase font-bold text-red-400 bg-red-400/10 px-2 rounded">Disabled</span>}
                            {p.stock !== null && <span className="text-xs uppercase font-bold text-blue-400 bg-blue-400/10 px-2 rounded">Stock: {p.stock}</span>}
                        </div>

                        <h3 className="text-xl font-bold flex items-center gap-2">
                            {p.name}
                        </h3>
                        <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{p.description}</p>

                        <div className="mt-4 flex justify-between items-end">
                            <div className="text-2xl font-bold">₹{p.price}</div>
                            <div className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded">{p.type}</div>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <ProductForm
                    initialData={editingProduct}
                    onClose={() => {
                        setShowForm(false)
                        setEditingProduct(null)
                    }}
                />
            )}
        </div>
    )
}
