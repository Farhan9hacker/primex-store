import { prisma } from "@/lib/prisma"
import ProductsClient from "./client"

export default async function AdminProductsPage() {
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
    })

    return <ProductsClient initialProducts={products} />
}
