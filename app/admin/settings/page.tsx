'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Palette } from 'lucide-react'

const THEMES = [
    { id: 'DEFAULT', name: 'Default (Purple)', color: 'bg-purple-600' },
    { id: 'XMAS', name: 'Christmas (Red/Green)', color: 'bg-red-600' },
    { id: 'HALLOWEEN', name: 'Halloween (Orange)', color: 'bg-orange-600' },
]

export default function SettingsPage() {
    const [currentTheme, setCurrentTheme] = useState('DEFAULT')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                setCurrentTheme(data.theme)
                setLoading(false)
            })
            .catch(() => toast.error('Failed to load settings'))
    }, [])

    const saveTheme = async (themeId: string) => {
        setSaving(true)
        setCurrentTheme(themeId) // Optimistic update
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: themeId })
            })
            if (res.ok) {
                toast.success('Theme updated!')
                // Force a reload to apply theme if we were doing server-side injection, 
                // but for now we might need client side context or just reload.
                // Let's reload to be safe and simple.
                window.location.reload()
            } else {
                toast.error('Failed to save theme')
            }
        } catch {
            toast.error('Error saving theme')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Palette className="h-8 w-8 text-purple-400" />
                Store Settings
            </h1>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Theme Selection</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {THEMES.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => saveTheme(theme.id)}
                            disabled={saving}
                            className={`p-4 rounded-xl border-2 transition-all text-left group relative overflow-hidden ${currentTheme === theme.id
                                    ? 'border-white bg-zinc-800'
                                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900'
                                }`}
                        >
                            <div className={`h-24 rounded-lg mb-4 ${theme.color} opacity-20 group-hover:opacity-30 transition-all`} />

                            <div className="relative z-10">
                                <h3 className="font-bold text-lg">{theme.name}</h3>
                                {currentTheme === theme.id && (
                                    <span className="text-xs text-green-400 font-mono mt-1 block">● Active</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
