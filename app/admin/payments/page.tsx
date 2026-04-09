import { prisma } from "@/lib/prisma"
import PaymentActions from "./actions"

export default async function AdminPaymentsPage() {
    const payments = await prisma.payment.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    })

    const historyPayments = await prisma.payment.findMany({
        where: { status: { not: 'PENDING' } },
        orderBy: { reviewedAt: 'desc' }, // Use reviewedAt since updatedAt doesn't exist
        take: 20,
        include: { user: true }
    })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Pending Approvals</h1>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {payments.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No pending payments.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">UTR / Proof</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {payments.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{p.user.email}</div>
                                        <div className="text-xs text-zinc-500">{p.userId}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-green-400">₹{p.amount}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-zinc-300">{p.utr}</div>
                                        {p.screenshotUrl && (
                                            <a
                                                href={p.screenshotUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-400 hover:text-blue-300 underline mt-1 block"
                                            >
                                                View Screenshot
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-400">{p.createdAt.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <PaymentActions id={p.id} utr={p.utr} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <h2 className="text-xl font-bold mt-12 mb-4 text-zinc-300">Recently Processed Payments</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow">
                {historyPayments.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No payment history found.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">UTR</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {historyPayments.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{p.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">₹{p.amount}</td>
                                    <td className="px-6 py-4 font-mono text-sm text-zinc-400">{p.utr}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                            p.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {p.reviewedAt ? p.reviewedAt.toLocaleString() : p.createdAt.toLocaleString()}
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
