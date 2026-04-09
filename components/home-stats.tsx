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
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded overflow-hidden bg-zinc-800 shrink-0">
                            {buyer.user !== "Anonymous" ? (
                                <Image
                                    src={`https://mc-heads.net/avatar/${buyer.user}/32`}
                                    alt={buyer.user}
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center font-bold text-xs">
                                    ?
                                </div>
                            )}
                        </div>
                        <span className="font-medium text-sm truncate max-w-[120px]">{buyer.user}</span>
                    </div>
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
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 relative overflow-hidden"
                >
                    {i === 0 && <div className="absolute top-0 right-0 p-1 bg-yellow-500 text-black text-[10px] font-bold rounded-bl shadow-sm">#1</div>}
                    {i === 1 && <div className="absolute top-0 right-0 p-1 bg-gray-400 text-black text-[10px] font-bold rounded-bl shadow-sm">#2</div>}
                    {i === 2 && <div className="absolute top-0 right-0 p-1 bg-orange-700 text-black text-[10px] font-bold rounded-bl shadow-sm">#3</div>}

                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded overflow-hidden bg-zinc-800 shrink-0">
                            {donator.user !== "Anonymous" ? (
                                <Image
                                    src={`https://mc-heads.net/avatar/${donator.user}/32`}
                                    alt={donator.user}
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-zinc-700 flex items-center justify-center font-bold text-xs border border-zinc-600">
                                    {i + 1}
                                </div>
                            )}
                        </div>
                        <span className="font-medium text-sm truncate max-w-[120px]">{donator.user}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
