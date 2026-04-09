import type { DefaultSession } from "next-auth"


declare module "next-auth" {
    interface Session {
        user: {
            role: string
            id: string
            twoFactorEnabled: boolean
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        passwordHash: string
        twoFactorEnabled: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string
        twoFactorEnabled: boolean
    }
}
