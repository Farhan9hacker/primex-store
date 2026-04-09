
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/navbar"
import { redirect } from "next/navigation"
import { Shield, User, Wallet, LogOut } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { signOut } from "@/auth"
import ProfileClient from "@/components/profile-client"

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { wallet: true }
    })

    if (!user) redirect("/")

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden relative">
                            {session.user.image ? (
                                <Image
                                    src={session.user.image}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-zinc-500">
                                    <User className="h-10 w-10" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                                {user.minecraftIgn || user.email!.split('@')[0]}
                            </h1>
                            <p className="text-zinc-400">{user.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    {user.role}
                                </span>
                                {user.discordId && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                                        Linked
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Wallet Card */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-green-500" />
                                    Wallet Balance
                                </h2>
                                <Link href="/wallet" className="text-sm text-purple-400 hover:text-purple-300">
                                    Manage
                                </Link>
                            </div>
                            <div className="text-3xl font-mono font-bold bg-black/50 p-4 rounded-lg border border-zinc-800">
                                ₹{user.wallet?.balance.toFixed(2) || '0.00'}
                            </div>
                        </div>

                        {/* Security / Account Card */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                                <Shield className="h-5 w-5 text-blue-500" />
                                Account Security
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg">
                                    <span className="text-zinc-400">Two-Factor Auth</span>
                                    <span className={`text-sm font-bold ${user.twoFactorEnabled ? 'text-green-500' : 'text-zinc-500'}`}>
                                        {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg">
                                    <span className="text-zinc-400">Password</span>
                                    <span className="text-sm text-zinc-500">********</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Discord Link Section (Client Component for Interactivity) */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <svg className="w-6 h-6 fill-[#5865F2]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                                Discord Integration
                            </h2>
                        </div>

                        <div className="bg-black/30 p-6 rounded-xl border border-zinc-800">
                            {user.discordId ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-green-400 mb-1">Account Linked</p>
                                        <p className="text-zinc-400 text-sm">Your Discord account is connected to Primex Store.</p>
                                        <p className="text-zinc-500 text-xs mt-2 font-mono">ID: {user.discordId}</p>
                                    </div>
                                </div>
                            ) : (
                                <ProfileClient />
                            )}
                        </div>
                    </div>

                    {/* Sign Out */}
                    <form action={async () => {
                        'use server';
                        await signOut({ redirectTo: "/login" });
                    }}>
                        <button type="submit" className="flex items-center gap-2 text-red-500 hover:text-red-400 transition font-medium">
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
}
