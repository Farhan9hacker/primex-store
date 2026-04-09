'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [totpCode, setTotpCode] = useState('')
    const [showTwoFactor, setShowTwoFactor] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                email,
                password,
                totpCode: showTwoFactor ? totpCode : undefined,
                redirect: false,
            })

            console.log("Login result:", result)

            if (result?.error) {
                console.log("Raw login error:", result.error)
                if (result.error.includes("2FA_REQUIRED") || result.error === "2FA_REQUIRED") {
                    setShowTwoFactor(true)
                    setError("")
                } else if (result.error.includes("Invalid 2FA Code")) {
                    setError("Invalid Authentication Code")
                } else if (result.error === "CredentialsSignin") {
                    // NextAuth sometimes masks the code as the error name
                    // We can try to assume it's invalid creds, but for now let's show it or stick to generic
                    setError('Invalid email or password')
                } else {
                    // Show actual error for debugging
                    setError(`Login Failed: ${result.error}`)
                }
            } else {
                router.push('/')
                router.refresh()
            }
        } catch (err) {
            console.error("Login exception:", err)
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        PRIMEX ANARCHY
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        {showTwoFactor ? "Enter authentication code" : "Sign in to your account"}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {!showTwoFactor ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="sr-only">Email address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-zinc-700 placeholder-zinc-500 text-zinc-200 bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-zinc-700 placeholder-zinc-500 text-zinc-200 bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="totp" className="sr-only">2FA Code</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <input
                                        id="totp"
                                        name="totp"
                                        type="text"
                                        required
                                        autoFocus
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-zinc-700 placeholder-zinc-500 text-zinc-200 bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors text-center tracking-widest text-xl font-mono"
                                        placeholder="000000"
                                        maxLength={6}
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setShowTwoFactor(false)}
                                    className="text-xs text-zinc-500 hover:text-zinc-300"
                                >
                                    Cancel and try different account
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {error}
                        </div>
                    )}


                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/25"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                showTwoFactor ? 'Verify' : 'Sign in'
                            )}
                        </button>
                    </div>

                    {!showTwoFactor && (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-zinc-800" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-zinc-900 text-zinc-500">Or continue with</span>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="button"
                                    onClick={() => signIn('discord', { callbackUrl: '/' })}
                                    className="w-full flex justify-center py-3 px-4 border border-zinc-700 rounded-lg shadow-sm bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all items-center gap-2"
                                >
                                    <svg className="w-5 h-5 fill-[#5865F2]" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                                    Discord
                                </button>
                            </div>
                        </>
                    )}

                    <div className="text-center text-sm">
                        <span className="text-zinc-400">Don't have an account? </span>
                        <a href="/register" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                            Sign up
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}
