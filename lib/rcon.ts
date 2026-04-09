import { Rcon } from 'rcon-client'
import { prisma } from '@/lib/prisma'

const RCON_HOST = process.env.RCON_HOST || 'localhost'
const RCON_PORT = parseInt(process.env.RCON_PORT || '25575')
const RCON_PASSWORD = process.env.RCON_PASSWORD || 'password'

type RconResult =
    | { success: true; response: string }
    | { success: false; error: string }

async function getRconSettings(serverIdentifier?: string) {
    try {
        const keys = [
            'RCON_HOST', 'RCON_PORT', 'RCON_PASSWORD',
            'RCON_HOST_2', 'RCON_PORT_2', 'RCON_PASSWORD_2', 'RCON_MODE_2',
            'RCON_HOST_3', 'RCON_PORT_3', 'RCON_PASSWORD_3', 'RCON_MODE_3'
        ]

        const settings = await prisma.systemSetting.findMany({
            where: { key: { in: keys } }
        })

        const config: Record<string, string> = {}
        settings.forEach(s => config[s.key] = s.value)

        // Determine which slot to use
        // Slot 1 is default
        let host = config['RCON_HOST'] || RCON_HOST
        let port = parseInt(config['RCON_PORT'] || RCON_PORT.toString())
        let password = config['RCON_PASSWORD'] || RCON_PASSWORD

        if (serverIdentifier) {
            if (config['RCON_MODE_2'] && config['RCON_MODE_2'] === serverIdentifier) {
                host = config['RCON_HOST_2'] || host
                port = parseInt(config['RCON_PORT_2'] || port.toString())
                password = config['RCON_PASSWORD_2'] || password
            } else if (config['RCON_MODE_3'] && config['RCON_MODE_3'] === serverIdentifier) {
                host = config['RCON_HOST_3'] || host
                port = parseInt(config['RCON_PORT_3'] || port.toString())
                password = config['RCON_PASSWORD_3'] || password
            }
        }

        return { host, port, password }
    } catch {
        // Fallback if DB fails
        return { host: RCON_HOST, port: RCON_PORT, password: RCON_PASSWORD }
    }
}

export const rcon = {
    // Legacy execute (wrapper around loggable)
    execute: async (command: string, serverIdentifier?: string): Promise<RconResult> => {
        return rcon.executeWithLog(command, 'SYSTEM', undefined, undefined, undefined, serverIdentifier)
    },

    executeWithLog: async (command: string, source: string = 'SYSTEM', performedBy?: string, orderId?: string, metadata?: any, serverIdentifier?: string): Promise<RconResult> => {
        const settings = await getRconSettings(serverIdentifier)

        if (!settings.host) {
            return { success: false, error: 'RCON_HOST not set' }
        }

        let result: RconResult
        try {
            const client = await Rcon.connect({
                host: settings.host,
                port: settings.port,
                password: settings.password,
                timeout: 5000
            })

            console.log(`[RCON] Executing: ${command}`)
            const response = await client.send(command)
            await client.end()

            result = { success: true, response }
        } catch (error) {
            console.error(`[RCON] Error executing ${command}:`, error)
            result = { success: false, error: error instanceof Error ? error.message : "Connect Error" }
        }

        // Log to DB
        try {
            await prisma.rconLog.create({
                data: {
                    command,
                    response: result.success ? result.response : null,
                    status: result.success ? 'SENT' : 'FAILED',
                    source,
                    performedBy,
                    orderId,
                    metadata: metadata ? JSON.stringify(metadata) : null
                }
            })
        } catch (logError) {
            console.error("Failed to log RCON command:", logError)
        }

        return result
    },

    testConnection: async (serverIdentifier?: string) => {
        const settings = await getRconSettings(serverIdentifier)
        try {
            const client = await Rcon.connect({
                host: settings.host,
                port: settings.port,
                password: settings.password,
                timeout: 3000
            })
            await client.end()
            return { success: true }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Connect Error" }
        }
    },

    testAllConnections: async () => {
        const settings = await prisma.systemSetting.findMany({
            where: { key: { in: ['RCON_MODE_2', 'RCON_MODE_3'] } }
        })
        const modes: any = {}
        settings.forEach(s => modes[s.key] = s.value)

        const servers = [
            { id: 'DEFAULT', name: 'Anarchy' },
            { id: modes['RCON_MODE_2'] || 'SERVER_2', name: 'Crystal PvP' },
            { id: modes['RCON_MODE_3'] || 'SERVER_3', name: 'Lifesteal' }
        ]

        // Filter out unconfigured slots effectively? 
        // We will just test them, if they fail (due to empty host), they fail.

        const results = await Promise.all(servers.map(async (server) => {
            // For secondary servers, if ID is generic SERVER_X (meaning mode not set), we might still want to test if host is set?
            // But let's rely on getRconSettings logic.
            // Actually, we pass the ID found in mode, or if not found, we pass nothing? 
            // Wait, getRconSettings logic depends on the ID matching the RCON_MODE_X value.

            // If we want to test "Slot 2", we need to know its ID.
            // If the user hasn't set an ID, getRconSettings won't find it easily unless we pass a special flag or fix getRconSettings.

            // Let's stick to: we test what we know.
            // Ideally we refactor getRconSettings to take a slot index, but for now let's use the ID.

            const result = await rcon.testConnection(server.id === 'DEFAULT' ? undefined : server.id)
            return {
                id: server.id,
                name: server.name,
                ...result
            }
        }))

        return results
    },

    // For manual dynamic execution (still logs if needed, but usually we use executeWithLog now)
    executeDynamic: async (host: string, port: number, password: string, command: string): Promise<RconResult> => {
        try {
            const client = await Rcon.connect({ host, port, password, timeout: 5000 })
            const response = await client.send(command)
            await client.end()
            return { success: true, response }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
        }
    }
}
