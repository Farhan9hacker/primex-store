
import { Client, GatewayIntentBits } from 'discord.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
})

async function main() {
    console.log('Starting Discord Bot...')

    const setting = await prisma.systemSetting.findUnique({
        where: { key: 'DISCORD_BOT_TOKEN' }
    })

    if (!setting?.value) {
        console.error('❌ DISCORD_BOT_TOKEN not found in SystemSettings')
        process.exit(1)
    }

    client.once('ready', () => {
        console.log(`✅ Logged in as ${client.user?.tag}`)
        console.log('Bot is now Online!')
    })

    try {
        await client.login(setting.value)
    } catch (error) {
        console.error('❌ Failed to login:', error)
        process.exit(1)
    }
}

main()
    .catch((e) => {
        console.error(e)
        // prisma disconnect handled by script termination
    })
