import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/footer";
import { SessionProvider } from "next-auth/react";
import { prisma } from "@/lib/prisma"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Primex Anarchy Store",
  description: "Official store for Primex Anarchy",
  icons: {
    icon: "/logo.jpg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [themeSetting, bannerTextSet, bannerEnabledSet] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: 'theme' } }),
    prisma.systemSetting.findUnique({ where: { key: 'SITE_BANNER_TEXT' } }),
    prisma.systemSetting.findUnique({ where: { key: 'SITE_BANNER_ENABLED' } })
  ])
  
  const themeClass = themeSetting?.value ? `theme-${themeSetting.value}` : ''
  const bannerEnabled = bannerEnabledSet?.value === 'true'
  const bannerText = bannerTextSet?.value || ''

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-white ${themeClass}`}
      >
        <SessionProvider>
          {bannerEnabled && bannerText && (
            <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 px-4 shadow-[0_0_15px_rgba(168,85,247,0.3)] z-50 relative flex items-center justify-center gap-2 font-bold tracking-wide">
               {bannerText}
            </div>
          )}
          {children}
          <Footer />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
