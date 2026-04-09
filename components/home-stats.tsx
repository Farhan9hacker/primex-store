'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export interface Buyer {
    user: string
    date: Date
}

export interface Donator {
    user: string
}

interface RecentBuyersProps {
    data: Buyer[]
}

interface TopDonatorsProps {
    data: Donator[]
}

export function RecentBuyersList({ data }: RecentBuyersProps) {
    if (data.length === 0) return <div className="text-zinc-500 text-sm">No recent purchases.</div>

    return (
        <div className="space-y-3">
            {data.map((buyer, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center justify-between bg-[#0f0f15]/80 backdrop-blur-md p-3 rounded-xl border border-purple-500/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:border-purple-500/40 transition-all duration-300 group cursor-default"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded overflow-hidden bg-black/50 shrink-0 border border-white/5 group-hover:border-purple-500/50 transition-colors shadow-inner relative">
                            <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                            {buyer.user !== "Anonymous" ? (
                                <Image
                                    src={`https://mc-heads.net/avatar/${buyer.user}/40`}
                                    alt={buyer.user}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center font-bold text-white text-sm">
                                    ?
                                </div>
                            )}
                        </div>
                        <span className="font-bold text-sm text-zinc-300 group-hover:text-white truncate max-w-[120px] transition-colors">{buyer.user}</span>
                    </div>
                    {/* Add a subtle visual element on the right side if needed, maybe simple dots or a shopping bag icon faintly in the background */}
                </motion.div>
            ))}
        </div>
    )
}

export function TopDonatorsList({ data }: TopDonatorsProps) {
    if (data.length === 0) return <div className="text-zinc-500 text-sm">No donators yet.</div>

    return (
        <div className="space-y-3">
            {data.map((donator, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, x: -5 }}
                    className={`flex items-center justify-between backdrop-blur-md p-3 rounded-xl border shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 group cursor-default relative overflow-hidden ${
                         i === 0 ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-[0_0_25px_rgba(234,179,8,0.2)]' :
                         i === 1 ? 'bg-zinc-300/10 border-zinc-400/20 hover:border-zinc-400/50 hover:shadow-[0_0_20px_rgba(161,161,170,0.15)]' :
                         i === 2 ? 'bg-orange-700/10 border-orange-700/30 hover:border-orange-700/60 hover:shadow-[0_0_20px_rgba(194,65,12,0.15)]' :
                         'bg-[#0f0f15]/80 border-purple-500/10 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                    }`}
                >
                    {/* Ranking Badges */}
                    {i === 0 && <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black text-[10px] font-black rounded-bl-lg shadow-[0_0_10px_rgba(234,179,8,0.5)] z-20 flex items-center gap-1">👑 #1</div>}
                    {i === 1 && <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-zinc-500 to-zinc-300 text-black text-[10px] font-black rounded-bl-lg shadow-[0_0_10px_rgba(161,161,170,0.4)] z-20">#2</div>}
                    {i === 2 && <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-orange-800 to-orange-500 text-white text-[10px] font-black rounded-bl-lg shadow-[0_0_10px_rgba(194,65,12,0.4)] z-20">#3</div>}

                    {/* Ambient Glows */}
                    {i === 0 && <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}

                    <div className="flex items-center gap-3 relative z-10">
                        <div className={`h-10 w-10 rounded overflow-hidden shrink-0 border relative shadow-inner ${
                            i === 0 ? 'bg-yellow-900/50 border-yellow-500/50' :
                            i === 1 ? 'bg-zinc-800 border-zinc-400/30' :
                            i === 2 ? 'bg-orange-900/50 border-orange-600/40' :
                            'bg-black/50 border-white/5 group-hover:border-purple-500/50 transition-colors'
                        }`}>
                            {donator.user !== "Anonymous" ? (
                                <Image
                                    src={`https://mc-heads.net/avatar/${donator.user}/40`}
                                    alt={donator.user}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                />
                            ) : (
                                <div className={`h-full w-full flex items-center justify-center font-bold text-sm ${
                                    i === 0 ? 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-white' :
                                    'bg-zinc-800 text-zinc-400'
                                }`}>
                                    {i + 1}
                                </div>
                            )}
                        </div>
                        <span className={`font-bold text-sm truncate max-w-[120px] transition-colors ${
                            i === 0 ? 'text-yellow-100 group-hover:text-white' :
                            i === 1 ? 'text-zinc-200 group-hover:text-white' :
                            i === 2 ? 'text-orange-200 group-hover:text-white' :
                            'text-zinc-300 group-hover:text-white'
                        }`}>
                            {donator.user}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
