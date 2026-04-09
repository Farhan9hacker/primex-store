'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export function RevenueChart({ data }: { data: any[] }) {
    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#71717a" fontSize={12} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#a855f7' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: "#a855f7" }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

const COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']

export function PopularProductsChart({ data }: { data: any[] }) {
    if (data.length === 0) return <div className="h-[300px] flex items-center justify-center text-zinc-500">No data available</div>

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
                {data.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs text-zinc-400">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {entry.name} ({entry.value})
                    </div>
                ))}
            </div>
        </div>
    )
}
