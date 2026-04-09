'use client'

import { useState, useEffect } from 'react'
import { Terminal, Shield, CheckCircle, XCircle, RefreshCw, Loader2, Save, Settings, ShieldAlert, Send, Server } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface RconLog {
    id: string
    command: string
    status: string
    source: string
    createdAt: string
    order?: {
        product: { name: string }
        user: { email: string, minecraftIgn: string | null }
    }
}

interface ServerStatus {
    id: string
    name: string
    success: boolean
    error?: string
}

export default function AdminRconPage() {
    const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([])
    const [logs, setLogs] = useState<RconLog[]>([])
    const [loading, setLoading] = useState(true)
    const [testing, setTesting] = useState(false)
    const [activeTab, setActiveTab] = useState<'status' | 'settings'>('status')

    // Manual Execution State
    const [manualCommand, setManualCommand] = useState('')
    const [selectedServerId, setSelectedServerId] = useState<string>('DEFAULT')
    const [executing, setExecuting] = useState(false)
    const [manualResponse, setManualResponse] = useState<string | null>(null)

    // Settings State
    const [settings, setSettings] = useState({
        host: '', port: '25575', password: '',
        host2: '', port2: '', password2: '', mode2: '',
        host3: '', port3: '', password3: '', mode3: '',
        webhookUrl: '',
        botToken: '',
        guildId: ''
    })
    const [savingSettings, setSavingSettings] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                testConnection(),
                // fetchLogs(), // Handled by separate useEffect with logLimit dep
                fetchSettings()
            ])
        } finally {
            setLoading(false)
        }
    }

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/rcon/settings')
            if (res.ok) {
                const data = await res.json()
                setSettings({
                    host: data.host || '',
                    port: data.port || '25575',
                    password: data.password || '',

                    host2: data.host2 || '',
                    port2: data.port2 || '',
                    password2: data.password2 || '',
                    mode2: data.mode2 || '',

                    host3: data.host3 || '',
                    port3: data.port3 || '',
                    password3: data.password3 || '',
                    mode3: data.mode3 || '',

                    webhookUrl: data.webhookUrl || '',
                    botToken: data.botToken || '',
                    guildId: data.guildId || ''
                })
            }
        } catch { }
    }

    const testConnection = async () => {
        setTesting(true)
        try {
            const res = await fetch('/api/admin/rcon/stats')
            const data = await res.json()

            if (Array.isArray(data)) {
                setServerStatuses(data)
                const anySuccess = data.some(s => s.success)
                if (anySuccess) {
                    toast.success('RCON Status Updated')
                } else {
                    toast.error('All RCON Connections Failed')
                }
            } else {
                // Fallback for old format
                setServerStatuses([{ id: 'DEFAULT', name: 'Server 1', success: data.success, error: data.error }])
            }

        } catch {
            setServerStatuses([{ id: 'DEFAULT', name: 'Server 1', success: false, error: 'Network Error' }])
        } finally {
            setTesting(false)
        }
    }

    const handleSaveSettings = async () => {
        setSavingSettings(true)
        try {
            const res = await fetch('/api/admin/rcon/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            if (res.ok) {
                toast.success('Settings Saved')
                testConnection()
            } else {
                toast.error('Failed to save settings')
            }
        } catch {
            toast.error('Error saving settings')
        } finally {
            setSavingSettings(false)
        }
    }

    const [logLimit, setLogLimit] = useState(5)

    useEffect(() => {
        fetchLogs()
    }, [logLimit])

    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/admin/rcon/logs?limit=${logLimit}`)
            if (res.ok) setLogs(await res.json())
        } catch (error) { console.error(error) }
    }

    const handleExecute = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!manualCommand) return

        setExecuting(true)
        setManualResponse(null)
        try {
            const res = await fetch('/api/admin/rcon/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: manualCommand,
                    serverIdentifier: selectedServerId === 'DEFAULT' ? undefined : selectedServerId
                })
            })

            const data = await res.json()
            if (res.ok) {
                setManualResponse(data.response || 'Command Sent (No Response)')
                toast.success('Command Executed')
                fetchLogs()
                setManualCommand('')
            } else {
                setManualResponse(`Error: ${data.error}`)
                toast.error(data.error)
            }
        } catch {
            toast.error('Failed to execute command')
        } finally {
            setExecuting(false)
        }
    }

    const onlineServers = serverStatuses.filter(s => s.success)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Terminal className="h-6 w-6 text-purple-500" />
                    RCON Console
                </h1>
                <button
                    onClick={testConnection}
                    disabled={testing}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition disabled:opacity-50"
                >
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh Status
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-zinc-800">
                {['status', 'settings'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-2 px-2 text-sm font-medium transition capitalize ${activeTab === tab ? 'text-purple-500 border-b-2 border-purple-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'status' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {serverStatuses.filter(s => s.success).map(server => (
                            <div key={server.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${server.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {server.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{server.name}</h3>
                                    <p className={`text-xs ${server.success ? 'text-green-400' : 'text-red-400'}`}>
                                        {server.success ? 'Online' : (server.error || 'Offline')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-6">
                        <div className="p-4 border-b border-zinc-800">
                            <h3 className="font-bold">Command History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-zinc-800/50 text-zinc-400">
                                    <tr>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Command</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-zinc-800/20">
                                            <td className="px-6 py-4 text-zinc-400">
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${['DELIVERED', 'SENT', 'SUCCESS'].includes(log.status) ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-purple-300">
                                                {log.command}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-zinc-800 px-2 py-1 rounded">{log.source}</span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400">
                                                {log.order ? (
                                                    <div>
                                                        <div className="text-white">{log.order.user.minecraftIgn}</div>
                                                        <div className="text-xs">{log.order.product.name}</div>
                                                    </div>
                                                ) : <span className="text-xs italic">Manual Action</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {logs.length >= logLimit && (
                            <div className="p-4 border-t border-zinc-800 text-center">
                                <button
                                    onClick={() => setLogLimit(prev => prev + 20)}
                                    className="text-sm text-zinc-400 hover:text-white transition font-medium"
                                >
                                    Show More
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}


            {
                activeTab === 'settings' && (
                    <div className="max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                        <h3 className="font-bold border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5" /> RCON Configuration
                        </h3>
                        <div className="space-y-6">
                            {/* Server 1 */}
                            <div className="bg-zinc-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2">Server 1 (Anarchy)</h4>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Host IP</label>
                                        <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" placeholder="127.0.0.1" value={settings.host} onChange={e => setSettings({ ...settings, host: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Port</label>
                                        <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" placeholder="25575" value={settings.port} onChange={e => setSettings({ ...settings, port: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Password</label>
                                        <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" type="password" placeholder="********" value={settings.password} onChange={e => setSettings({ ...settings, password: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Server 2 */}
                            <div className="bg-zinc-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2">Server 2 (Crystal PvP)</h4>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Server Mode ID (e.g. CPVP)</label>
                                        <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" placeholder="CPVP" value={settings.mode2} onChange={e => setSettings({ ...settings, mode2: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Host IP</label>
                                        <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" placeholder="127.0.0.1" value={settings.host2} onChange={e => setSettings({ ...settings, host2: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Port</label>
                                            <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" placeholder="25575" value={settings.port2} onChange={e => setSettings({ ...settings, port2: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Password</label>
                                            <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" type="password" placeholder="********" value={settings.password2} onChange={e => setSettings({ ...settings, password2: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Server 3 */}
                            <div className="bg-zinc-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2">Server 3 (Lifesteal)</h4>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Server Mode ID (e.g. LIFESTEAL)</label>
                                        <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" placeholder="LIFESTEAL" value={settings.mode3} onChange={e => setSettings({ ...settings, mode3: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Host IP</label>
                                        <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" placeholder="127.0.0.1" value={settings.host3} onChange={e => setSettings({ ...settings, host3: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Port</label>
                                            <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" placeholder="25575" value={settings.port3} onChange={e => setSettings({ ...settings, port3: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Password</label>
                                            <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" type="password" placeholder="********" value={settings.password3} onChange={e => setSettings({ ...settings, password3: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-zinc-800 pt-4 mt-4">
                            <label className="block text-sm text-zinc-400 mb-1">Discord Webhook URL (Admin Alerts)</label>
                            <input
                                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                type="password"
                                placeholder="https://discord.com/api/webhooks/..."
                                value={settings.webhookUrl}
                                onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })}
                            />
                            <p className="text-xs text-zinc-500 mt-1">Used for login alerts and transaction notifications.</p>
                        </div>

                        <div className="border-t border-zinc-800 pt-4 mt-4 space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Discord Bot Token (Role Assignment)</label>
                                <input
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                    type="password"
                                    placeholder="Bot Token..."
                                    value={settings.botToken}
                                    onChange={e => setSettings({ ...settings, botToken: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Discord Server ID (Guild ID)</label>
                                <input
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                    placeholder="123456789..."
                                    value={settings.guildId}
                                    onChange={e => setSettings({ ...settings, guildId: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-zinc-500">Required for automatic role assignment on purchase.</p>
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {savingSettings ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                            Save Configuration
                        </button>
                    </div>
                )
            }
        </div >
    )
}
