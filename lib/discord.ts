import { WebhookClient, EmbedBuilder } from 'discord.js'
import { prisma } from '@/lib/prisma'

// You would typically set these in .env
// DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

const webhookUrl = process.env.DISCORD_WEBHOOK_URL

const getWebhookUrl = async (): Promise<string | undefined> => {
    const setting = await prisma.systemSetting.findUnique({
        where: { key: 'DISCORD_WEBHOOK_URL' }
    })
    return setting?.value || process.env.DISCORD_WEBHOOK_URL
}

export const discord = {
    sendAdminLoginAlert: async ({ userEmail, ip }: { userEmail: string, ip: string }) => {
        if (!webhookUrl) return

        try {
            const hook = new WebhookClient({ url: webhookUrl })

            const embed = new EmbedBuilder()
                .setTitle('🚨 Admin Login Detected')
                .setColor(0xFF0000) // Red
                .addFields(
                    { name: 'User', value: userEmail, inline: true },
                    { name: 'IP Address', value: ip, inline: true }
                )
                .setTimestamp()

            await hook.send({
                username: 'Primex Security Bot',
                embeds: [embed]
            })
        } catch (error) {
            console.error('Discord Webhook Failed', error)
        }
    },

    sendDepositAlert: async ({ userEmail, amount, utr }: { userEmail: string, amount: number, utr: string }) => {
        if (!webhookUrl) return

        try {
            const hook = new WebhookClient({ url: webhookUrl })

            const embed = new EmbedBuilder()
                .setTitle('💰 New Deposit Request')
                .setColor(0x00FF00) // Green
                .addFields(
                    { name: 'User', value: userEmail, inline: true },
                    { name: 'Amount', value: `₹${amount}`, inline: true },
                    { name: 'UTR', value: utr, inline: true }
                )
                .setTimestamp()

            await hook.send({
                username: 'Primex Store Bot',
                embeds: [embed]
            })
        } catch (error) {
            console.error('Discord Webhook Failed', error)
        }
    },

    sendOrderAlert: async ({ userEmail, product, price }: { userEmail: string, product: string, price: number }) => {
        if (!webhookUrl) return

        try {
            const hook = new WebhookClient({ url: webhookUrl })

            const embed = new EmbedBuilder()
                .setTitle('🛒 New Purchase')
                .setColor(0x9B59B6) // Purple
                .addFields(
                    { name: 'User', value: userEmail, inline: true },
                    { name: 'Product', value: product, inline: true },
                    { name: 'Price', value: `₹${price}`, inline: true }
                )
                .setTimestamp()

            await hook.send({
                username: 'Primex Store Bot',
                embeds: [embed]
            })
        } catch (error) {
            console.error('Discord Webhook Failed', error)
        }
    },

    sendPaymentApproved: async ({ userEmail, amount, utr }: { userEmail: string, amount: number, utr: string }) => {
        if (!webhookUrl) return

        try {
            const hook = new WebhookClient({ url: webhookUrl })

            const embed = new EmbedBuilder()
                .setTitle('✅ Payment Approved')
                .setColor(0x00FF00) // Green
                .addFields(
                    { name: 'User', value: userEmail, inline: true },
                    { name: 'Amount', value: `₹${amount}`, inline: true },
                    { name: 'UTR', value: utr, inline: true }
                )
                .setTimestamp()

            await hook.send({
                username: 'Primex Store Bot',
                embeds: [embed]
            })
        } catch (error) {
            console.error('Discord Webhook Failed', error)
        }
    },

    assignRole: async (discordUserId: string, roleId: string) => {
        try {
            const settings = await prisma.systemSetting.findMany({
                where: { key: { in: ['DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID'] } }
            })
            const config: any = {}
            settings.forEach(s => config[s.key] = s.value)

            const token = config.DISCORD_BOT_TOKEN
            const guildId = config.DISCORD_GUILD_ID

            if (!token || !guildId) {
                console.log("Discord Bot Token or Guild ID not set")
                return
            }

            const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bot ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const text = await response.text()
                console.error(`Failed to assign role ${roleId} to ${discordUserId}: ${response.status} ${text}`)
            } else {
                console.log(`Assigned role ${roleId} to ${discordUserId}`)
            }

        } catch (error) {
            console.error("Error assigning Discord role:", error)
        }
    }
}
