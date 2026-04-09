import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        env: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_AUTH_DISCORD_ID: !!process.env.AUTH_DISCORD_ID,
            HAS_DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID,
            AUTH_DISCORD_ID_LENGTH: process.env.AUTH_DISCORD_ID?.length,
            DISCORD_CLIENT_ID_LENGTH: process.env.DISCORD_CLIENT_ID?.length,
            HAS_AUTH_DISCORD_SECRET: !!process.env.AUTH_DISCORD_SECRET,
            HAS_DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        }
    });
}
