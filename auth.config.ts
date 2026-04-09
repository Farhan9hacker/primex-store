import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 Days
    },
    callbacks: {
        async jwt({ token, user, trigger, session, account, profile }) {
            if (user) {
                token.role = user.role
                token.twoFactorEnabled = (user as any).twoFactorEnabled


            }

            // Capture Discord ID and Image on initial sign in
            if (account?.provider === 'discord' && profile) {
                token.discordId = profile.id
                token.picture = (profile as any).image_url || (profile as any).avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${(profile as any).avatar}.png` : null
            }

            // If we have an existing user with discordId, ensure it's in the token
            if (user && (user as any).discordId) {
                token.discordId = (user as any).discordId
            }

            if (trigger === "update" && (session as any)?.twoFactorEnabled !== undefined) {
                token.twoFactorEnabled = (session as any).twoFactorEnabled
            }
            return token
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
                session.user.role = token.role as string
                session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
                // @ts-ignore
                session.user.discordId = token.discordId as string | undefined
                // @ts-ignore
                if (token.picture) session.user.image = token.picture as string
            }
            return session
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
