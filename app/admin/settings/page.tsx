'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Palette, Megaphone } from 'lucide-react'

const THEMES = [
    { id: 'DEFAULT', name: 'Default (Purple)', color: 'bg-purple-600' },
    { id: 'XMAS', name: 'Christmas (Red/Green)', color: 'bg-red-600' },
    { id: 'HALLOWEEN', name: 'Halloween (Orange)', color: 'bg-orange-600' },
]

export default function SettingsPage() {
    const [currentTheme, setCurrentTheme] = useState('DEFAULT')
    const [bannerText, setBannerText] = useState('')
    const [bannerEnabled, setBannerEnabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                setCurrentTheme(data.theme)
                setBannerText(data.bannerText || '')
                setBannerEnabled(data.bannerEnabled || false)
                setLoading(false)
            })
            .catch(() => toast.error('Failed to load settings'))
    }, [])

    const saveTheme = async (themeId: string) => {
        setSaving(true)
        setCurrentTheme(themeId)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: themeId })
            })
            if (res.ok) {
                toast.success('Theme updated!')
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

    const saveBanner = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bannerText, bannerEnabled })
            })
            if (res.ok) {
                toast.success('Site Banner updated successfully!')
            } else {
                toast.error('Failed to update banner')
            }
        } catch {
            toast.error('Error saving banner setup')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
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

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Megaphone className="h-6 w-6 text-purple-400" />
                    Global Site Banner
                </h2>
                <p className="text-sm text-zinc-500 mb-6">Display a public announcement or flash sale across the top of all pages.</p>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={bannerEnabled}
                                onChange={e => setBannerEnabled(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                        <span className="font-medium text-white">{bannerEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Announcement Text (Supports Emojis)</label>
                        <input
                            type="text"
                            placeholder="e.g. 🎉 NEW SEASON OUT NOW! 20% OFF ALL RANKS WITH CODE 'SUMMER26'"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white"
                            value={bannerText}
                            onChange={e => setBannerText(e.target.value)}
                        />
                    </div>
                    
                    <button
                        onClick={saveBanner}
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-colors mt-2"
                    >
                        Save Banner Status
                    </button>
                </div>
            </div>
        </div>
    )
}
