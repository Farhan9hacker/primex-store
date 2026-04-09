import { prisma } from "@/lib/prisma"
import { Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
    const logs = await prisma.adminLog.findMany({
        take: 100,
        orderBy: { timestamp: 'desc' },
        include: {
            admin: {
                select: { email: true }
            }
        }
    })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-purple-500" />
                Audit Logs
            </h1>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No logs found.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Admin</th>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">Target ID</th>
                                <th className="px-6 py-3">IP Info</th>
                                <th className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{log.admin.email}</div>
                                        <div className="text-xs text-zinc-500">{log.adminId}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${log.action === 'LOGIN' ? 'bg-green-500/10 text-green-400' :
                                                log.action === 'UPDATED_SETTINGS' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-zinc-800 text-zinc-300'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-zinc-400 text-xs">
                                        {log.targetId || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                        {log.ipHash}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-400">
                                        {log.timestamp.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
