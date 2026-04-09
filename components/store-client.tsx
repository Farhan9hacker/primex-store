'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Loader2, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'

interface Product {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number | null
    type: string
    category: string
    imageUrl?: string | null
    discordRoleId?: string | null
}

const CATEGORIES = ['All', 'Ranks', 'Crates', 'Keys', 'Special Items']

interface StoreClientProps {
    initialProducts: Product[]
    userIgn: string | null
    discordConnected: boolean
    isLoggedIn?: boolean
}

export default function StoreClient({ initialProducts, userIgn, discordConnected, isLoggedIn = false }: StoreClientProps) {
    const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
    const [loginModalOpen, setLoginModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [confirmIgn, setConfirmIgn] = useState(userIgn || '')
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0])
    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [loading, setLoading] = useState(false)
    const [purchasing, setPurchasing] = useState<string | null>(null)
    const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({})

    const toggleDesc = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedDesc(p => ({ ...p, [id]: !p[id] }))
    }

    // Fetch products when category changes (client-side filter/fetch)
    useEffect(() => {
        if (selectedCategory === 'All' && initialProducts.length > 0 && products !== initialProducts) {
            // If switching to All and we have initial data, use it? 
            // Actually, initialProducts might be mixed or specific.
            // Simplest: Always fetch on category change, OR filter client side if we had all.
            // Let's assume we fetch for now to keep it consistent with DB.
            // However, to optimize: if we loaded 'All' initially, we can filter client side.
        }

        const fetchProducts = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/store/products?category=${selectedCategory}`)
                const data = await res.json()
                setProducts(data)
            } catch {
                toast.error('Failed to fetch products')
            } finally {
                setLoading(false)
            }
        }

        // Skip first fetch if it matches initial state, but simpler to just fetch or track mounted.
        fetchProducts()
    }, [selectedCategory])

    const openPurchaseModal = (product: Product) => {
        if (!isLoggedIn) {
            setLoginModalOpen(true)
            return
        }
        setSelectedProduct(product)
        setConfirmIgn(userIgn || '')
        setPurchaseModalOpen(true)
    }

    const handlePurchase = async () => {
        if (!selectedProduct) return
        if (!confirmIgn || confirmIgn.length < 3) {
            toast.error("Please enter a valid Minecraft IGN")
            return
        }

        setPurchasing(selectedProduct.id)
        try {
            const res = await fetch('/api/store/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    serverMode: 'ANARCHY',
                    ign: confirmIgn
                })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success(`Successfully purchased ${selectedProduct.name}!`, {
                    description: 'Item delivered in-game.'
                })
                setPurchaseModalOpen(false)
            } else {
                toast.error(data.error || 'Purchase failed')
            }
        } catch {
            toast.error('Something went wrong')
        } finally {
            setPurchasing(null)
        }
    }

    return (
        <div className="flex-1 container mx-auto px-4 py-8">
            {/* Purchase Modal */}
            {/* Modals */}
            <AnimatePresence>
                {loginModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: -20 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="bg-[#0f0f15]/90 border border-purple-500/20 rounded-2xl w-full max-w-sm p-6 shadow-[0_8px_30px_rgba(124,58,237,0.2)] text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Info className="h-32 w-32 text-purple-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="bg-purple-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                                    <Info className="h-8 w-8 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2 text-white">Sign In Required</h2>
                                <p className="text-zinc-400 mb-6 text-sm">
                                    You must be logged in to purchase items from the store. This ensures your items and purchases are tracked securely.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setLoginModalOpen(false)}
                                        className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <a
                                        href="/login"
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] flex items-center justify-center"
                                    >
                                        Sign In
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {purchaseModalOpen && selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold mb-2">Confirm Purchase</h2>
                            <p className="text-zinc-400 mb-6">
                                You are about to purchase <span className="text-white font-bold">{selectedProduct.name}</span> for <span className="text-purple-400 font-bold">₹{selectedProduct.price}</span>.
                            </p>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Minecraft IGN</label>
                                    <input
                                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-600 outline-none transition"
                                        placeholder="Enter your accurate Username"
                                        value={confirmIgn}
                                        onChange={(e) => setConfirmIgn(e.target.value)}
                                    />
                                    <p className="text-xs text-zinc-500 mt-2">
                                        <span className="text-blue-400 font-bold">Bedrock Players:</span> Use <span className="text-zinc-300 font-mono">.</span> in front of your name (e.g. <span className="text-zinc-300 font-mono">.bunny</span>)
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        <span className="text-red-400 font-bold">IMPORTANT:</span> You must be <span className="text-white">ONLINE</span> on the server and have <span className="text-white">INVENTORY SPACE</span>.
                                    </p>
                                </div>

                                {selectedProduct.discordRoleId && !discordConnected && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3">
                                        <Info className="h-5 w-5 text-yellow-500 shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-bold text-yellow-500 mb-1">Discord Not Linked</p>
                                            <p className="text-zinc-400">
                                                This item includes a Discord Role, but you haven't linked your account.
                                                You will <span className="text-white font-bold">NOT</span> receive the role.
                                            </p>
                                            <a href="/profile" className="text-blue-400 hover:text-blue-300 underline mt-1 inline-block">
                                                Go to Profile to Link Discord
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPurchaseModalOpen(false)}
                                    disabled={!!purchasing}
                                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePurchase}
                                    disabled={!!purchasing}
                                    className="flex-1 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {purchasing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm & Deliver'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Store
                    </h1>
                    <p className="text-zinc-400">Upgrade your experience on Primex Anarchy.</p>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg overflow-x-auto max-w-full no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                selectedCategory === cat ? "bg-purple-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-purple-600" /></div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                    <ShoppingBag className="h-16 w-16 opacity-20" />
                    <p>No products found in this category.</p>
                </div>
            ) : (
                <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {products.map((product) => {
                        const isExpanded = expandedDesc[product.id]
                        return (
                        <motion.div 
                            key={product.id}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0 }
                            }}
                            className="group bg-[#0f0f15]/80 backdrop-blur-lg border border-purple-500/10 rounded-2xl p-6 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] hover:border-purple-500/40 flex flex-col relative overflow-hidden xl:hover:scale-[1.03] lg:hover:-translate-y-2"
                        >
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-15 transition transform group-hover:scale-110 duration-500">
                                <ShoppingBag className="h-32 w-32 text-purple-400" />
                            </div>

                            <div className="mb-4 z-10 flex-none">
                                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest bg-purple-500/10 px-3 py-1.5 rounded-full ring-1 ring-purple-500/20 shadow-[0_0_10px_rgba(124,58,237,0.1)]">
                                    {product.type}
                                </span>
                            </div>

                            {/* Product Image */}
                            <div className="h-48 w-full mb-4 bg-black/40 rounded-xl overflow-hidden relative group-hover:scale-105 transition duration-500 flex-none shadow-inner border border-white/5">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full text-zinc-700">
                                        <ShoppingBag className="h-12 w-12 opacity-20 text-purple-200" />
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-300 transition-colors z-10 flex-none">{product.name}</h3>
                            
                            <div className="flex-1 mt-1 z-10 mb-6 flex flex-col min-h-[4rem]">
                                <div className={cn(
                                    "text-zinc-400 text-sm leading-relaxed transition-all duration-300 relative",
                                    !isExpanded && "line-clamp-2"
                                )}>
                                    {product.description}
                                </div>
                                {product.description.length > 80 && (
                                    <button 
                                        onClick={(e) => toggleDesc(product.id, e)}
                                        className="text-xs font-bold text-purple-400 mt-2 hover:text-purple-300 transition text-left flex-none"
                                    >
                                        {isExpanded ? "Show Less" : "Read More"}
                                    </button>
                                )}
                            </div>

                            <div className="mt-auto z-10 flex-none">
                                <div className="flex items-end justify-between mb-4">
                                    <span className="text-zinc-500 text-sm font-medium">Price</span>
                                    <div className="text-right">
                                        {product.originalPrice && product.originalPrice > product.price && (
                                            <div className="text-sm text-zinc-500 line-through">₹{product.originalPrice}</div>
                                        )}
                                        <span className="text-2xl font-bold text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">₹{product.price}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openPurchaseModal(product)}
                                    disabled={!!purchasing}
                                    className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] border border-purple-500/50"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    Buy Now
                                </button>
                            </div>
                        </motion.div>
                    )})}
                </motion.div>
            )}
        </div>
    )
}
