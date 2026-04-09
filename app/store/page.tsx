import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Navbar from '@/components/navbar'
import StoreClient from '@/components/store-client'

export const dynamic = 'force-dynamic'

export default async function StorePage() {
    const session = await auth()

    // Parallel data fetching
    const [products, user] = await Promise.all([
        prisma.product.findMany({
            where: { isEnabled: true },
            orderBy: { price: 'desc' } // Default sort
        }),
        session?.user?.email ? prisma.user.findUnique({
            where: { email: session.user.email }
        }) : null
    ])

    return (
        <div className="min-h-screen flex flex-col relative">
            <Navbar />
            <StoreClient
                initialProducts={products}
                userIgn={user?.minecraftIgn || null}
                discordConnected={!!user?.discordId}
                isLoggedIn={!!session}
            />
        </div>
    )
}
