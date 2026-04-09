import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@primex.com'
    const password = 'admin123'

    console.log(`Checking user: ${email}`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.log('User NOT found!')
        return
    }

    console.log('User found:', user.id)
    console.log("Stored Password Hash (prefix):", user.passwordHash.substring(0, 15) + "...")
    console.log("Input Password Length:", password.length)
    console.log("Input Password ASCII codes:", password.split('').map(c => c.charCodeAt(0)))

    const isValid = await bcrypt.compare(password, user.passwordHash)
    console.log('--------------------------------------------------')
    console.log(`RESULT: ${isValid ? 'VALID_CREDENTIALS' : 'INVALID_CREDENTIALS'}`)
    console.log('--------------------------------------------------')
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
