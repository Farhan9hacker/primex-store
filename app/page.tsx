import { auth } from "@/auth"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import Navbar from "@/components/navbar"
import { RecentBuyersList, TopDonatorsList } from "@/components/home-stats"
import { prisma } from "@/lib/prisma"

export const revalidate = 60 // Revalidate every minute

export default async function Home() {
  const session = await auth()

  // Fetch stats server-side
  const [recentBuyersRaw, topDonatorsRaw] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { user: { select: { minecraftIgn: true } } }
    }),
    prisma.payment.groupBy({
      by: ['userId'],
      where: { status: "APPROVED" },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5
    })
  ])

  // Transform data
  const recentBuyers = recentBuyersRaw.map(p => ({
    user: p.user.minecraftIgn || "Anonymous",
    date: p.createdAt
  }))

  const topDonators = await Promise.all(topDonatorsRaw.map(async (entry) => {
    const user = await prisma.user.findUnique({
      where: { id: entry.userId },
      select: { minecraftIgn: true }
    })
    return {
      user: user?.minecraftIgn || "Anonymous"
    }
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="col-span-full mb-8">
            <h1 className="text-4xl font-bold mb-4">Store Overview</h1>
            <p className="text-zinc-400">Select a category to browse products for Primex Anarchy.</p>
          </div>

          {['Ranks', 'Crates', 'Keys', 'Special Items'].map((category) => (
            <Link
              href={`/store?category=${category}`}
              key={category}
              className="group relative bg-[#0f0f15]/80 backdrop-blur-lg border border-purple-500/10 rounded-2xl p-6 hover:border-purple-500/40 transition-all duration-300 cursor-pointer overflow-hidden block shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShoppingBag className="h-8 w-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-xl font-bold">{category}</h3>
              <p className="text-sm text-zinc-400 mt-2">Browse all {category.toLowerCase()}</p>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Buyers */}
          <div className="bg-[#0f0f15]/80 backdrop-blur-lg border border-purple-500/10 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-green-500" />
              Recent Buyers
            </h2>
            <RecentBuyersList data={recentBuyers} />
          </div>

          {/* Top Donators */}
          <div className="bg-[#0f0f15]/80 backdrop-blur-lg border border-purple-500/10 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-yellow-500" />
              Top Donators
            </h2>
            <TopDonatorsList data={topDonators} />
          </div>
        </div>
      </main>
    </div>
  )
}
