import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import DiscordProvider from "next-auth/providers/discord"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { discord } from "@/lib/discord"

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}

import { authConfig } from "./auth.config"

const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            // @ts-ignore
            async authorize(credentials) {
                console.log("Authorize called with:", {
                    email: credentials?.email,
                    hasPassword: !!credentials?.password,
                    totpCode: credentials?.totpCode
                })

                const parsedCredentials = z
                    .object({
                        email: z.string().email(),
                        password: z.string().min(6),
                        totpCode: z.string().optional()
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password, totpCode } = parsedCredentials.data;
                    const normalizedEmail = email.toLowerCase()
                    console.log("Fetching user from DB:", normalizedEmail)
                    const user = await getUser(normalizedEmail);

                    if (!user) {
                        console.log("User not found in DB")
                        return null
                    }

                    console.log("User found. ID:", user.id)
                    console.log("Stored Password Hash (prefix):", user.passwordHash.substring(0, 15) + "...")
                    console.log("Received Password Length:", password.length)
                    console.log("Received Password ASCII codes:", password.split('').map(c => c.charCodeAt(0)))

                    // Password check
                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

                    if (!passwordsMatch) {
                        console.log("Password mismatch")
                        return null
                    }
                    console.log("Password matched!")

                    return user;
                } else {
                    console.log("Zod validation failed:", parsedCredentials.error)
                }

                return null;
            },
        }),
        DiscordProvider({
            clientId: process.env.AUTH_DISCORD_ID || process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.AUTH_DISCORD_SECRET || process.env.DISCORD_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }) {
            console.log("SignIn Callback triggered for user:", user?.id)

            if (account?.provider === 'discord' && user?.email) {
                try {
                    // Check if user exists
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email }
                    })

                    let userId = existingUser?.id

                    if (!existingUser) {
                        // Create new user
                        const newUser = await prisma.user.create({
                            data: {
                                email: user.email,
                                // name: user.name || profile?.username as string || 'Unknown',
                                discordId: profile?.id as string,
                                image: profile && ((profile as any).image_url || (profile as any).avatar) ? `https://cdn.discordapp.com/avatars/${profile.id}/${(profile as any).avatar}.png` : null,
                                passwordHash: "DISCORD_AUTH", // Placeholder
                                role: 'USER',
                                twoFactorEnabled: false
                            }
                        })
                        userId = newUser.id

                        // Create Wallet
                        await prisma.wallet.create({
                            data: { userId: newUser.id }
                        })
                    } else if (profile?.id) {
                        // Link Discord ID or Update Image if needed
                        const avatarUrl = (profile as any).image_url || (profile as any).avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${(profile as any).avatar}.png` : null;

                        if (!existingUser.discordId || existingUser.image !== avatarUrl) {
                            await prisma.user.update({
                                where: { id: existingUser.id },
                                data: {
                                    discordId: profile.id as string,
                                    image: avatarUrl
                                }
                            })
                        }
                    }

                    // Admin Alert Logic (Preserved)
                    if (existingUser?.role === 'ADMIN' || (userId && (await prisma.user.findUnique({ where: { id: userId } }))?.role === 'ADMIN')) {
                        const adminUser = existingUser || await prisma.user.findUnique({ where: { id: userId } })
                        if (adminUser) {
                            // 1. Send Discord Alert
                            discord.sendAdminLoginAlert({
                                userEmail: adminUser.email,
                                ip: "Unknown (Auth Callback)"
                            })

                            // 2. Log to Database
                            await prisma.adminLog.create({
                                data: {
                                    adminId: adminUser.id,
                                    action: 'LOGIN',
                                    ipHash: 'UNKNOWN',
                                }
                            }).catch(e => console.error("Failed to log admin login", e))
                        }
                    }
                } catch (error) {
                    console.error("Error in Discord SignIn:", error)
                    return false
                }
            }

            return true
        },

        async jwt({ token, user, trigger, session, account, profile }) {
            // 1. Initial Sign In Logic
            if (user) {
                token.role = user.role
                token.twoFactorEnabled = (user as any).twoFactorEnabled
            }

            // 2. Discord Specific: Fetch real DB ID and Image
            if (account?.provider === 'discord') {
                if (profile && user?.email) {
                    // Fetch User from DB to get the correct UUID (sub) and Image
                    const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
                    if (dbUser) {
                        token.sub = dbUser.id
                        token.role = dbUser.role
                        token.twoFactorEnabled = dbUser.twoFactorEnabled
                        token.discordId = dbUser.discordId
                        token.picture = dbUser.image
                    }
                }
            }

            // 3. Existing User Logic (Credentials)
            if (user && (user as any).discordId) {
                token.discordId = (user as any).discordId
            }

            // 4. Session Update Trigger
            if (trigger === "update" && (session as any)?.twoFactorEnabled !== undefined) {
                token.twoFactorEnabled = (session as any).twoFactorEnabled
            }

            return token
        },
    },
})

export { handlers, auth, signIn, signOut }
