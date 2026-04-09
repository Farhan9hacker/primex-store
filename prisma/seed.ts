import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Admin User
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@primex.com' },
        update: {
            passwordHash: adminPassword,
            role: 'ADMIN'
        },
        create: {
            email: 'admin@primex.com',
            passwordHash: adminPassword,
            role: 'ADMIN',
            minecraftIgn: 'Admin',
            wallet: {
                create: {
                    balance: 1000000,
                    status: 'ACTIVE'
                }
            }
        },
    })
    console.log({ admin })

    // 2. Requested User
    const userPassword = await bcrypt.hash('farhan@055461X', 10)
    const user = await prisma.user.upsert({
        where: { email: '2k8farhan@gmail.com' },
        update: {
            passwordHash: userPassword
        },
        create: {
            email: '2k8farhan@gmail.com',
            passwordHash: userPassword,
            role: 'USER',
            minecraftIgn: 'Farhan',
            wallet: {
                create: {
                    balance: 500,
                    status: 'ACTIVE'
                }
            }
        },
    })
    console.log({ user })

    // 3. Sample Products
    const products = [
        {
            name: 'VIP Rank',
            description: 'Get VIP status with exclusive perks',
            price: 199,
            type: 'RANK',
            category: 'Ranks',
            serverMode: 'ANARCHY',
            deliveryCommand: 'lp user {player} parent add vip',
            isPermanent: true
        },
        {
            name: 'MVP Rank',
            description: 'The ultimate rank for anarchy players',
            price: 499,
            type: 'RANK',
            category: 'Ranks',
            serverMode: 'ANARCHY',
            deliveryCommand: 'lp user {player} parent add mvp',
            isPermanent: true
        },
        {
            name: '10x Crate Keys',
            description: 'Open 10 legendary crates',
            price: 99,
            type: 'ITEM',
            category: 'Crates',
            serverMode: 'ANARCHY',
            deliveryCommand: 'crate give {player} legendary 10',
            isPermanent: false
        }
    ]

    for (const p of products) {
        // Upsert products to avoid duplicates if running multiple times is common
        const existing = await prisma.product.findFirst({ where: { name: p.name } })
        if (!existing) {
            await prisma.product.create({ data: p })
        }
    }
    console.log('Seeded products')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
