import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { discord } from "@/lib/discord"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData()
        const amountStr = formData.get('amount') as string
        const utrRaw = formData.get('utr') as string
        const file = formData.get('screenshot') as File | null

        const amount = parseFloat(amountStr)

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }

        // Handle UTR: Use provided or generate one
        let utr = utrRaw && utrRaw.trim() !== ''
            ? utrRaw
            : `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        // Handle File Upload
        let screenshotUrl = ''
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer())
            // Sanitize filename
            const filename = `pay_${Date.now()}_${file.name.replace(/\s/g, '_')}`
            const uploadDir = path.join(process.cwd(), "public", "uploads", "payments")
            const filePath = path.join(uploadDir, filename)

            await writeFile(filePath, buffer)
            screenshotUrl = `/uploads/payments/${filename}`

            // Try OCR if UTR is missing or if we want to validte
            if (!utrRaw) {
                try {
                    console.log("Starting OCR processing...")
                    const { createWorker } = require('tesseract.js');
                    const worker = await createWorker('eng');
                    const { data: { text } } = await worker.recognize(filePath);
                    await worker.terminate();

                    console.log("OCR Text:", text)
                    // Look for 12 digit number (common for UPI/IMPS RRN/UTR)
                    const utrMatch = text.match(/\b\d{12}\b/)
                    if (utrMatch) {
                        console.log("OCR Found UTR:", utrMatch[0])
                        // Override the fallback UTR with the found one
                        // We only do this if the user didn't explicitly provide one to avoid overwriting their manual entry with a misread
                        utr = utrMatch[0]
                    }
                } catch (ocrError) {
                    console.error("OCR Failed:", ocrError)
                }
            }
        }

        // Check duplicate UTR (only if user provided specific one, though good to check anyway)
        const existing = await prisma.payment.findUnique({
            where: { utr }
        })

        if (existing) {
            return NextResponse.json({ error: "Transaction ID (UTR) already exists" }, { status: 409 })
        }

        const payment = await prisma.payment.create({
            data: {
                userId: session.user.id,
                amount,
                utr,
                screenshotUrl,
                status: "PENDING",
                riskLevel: "LOW"
            }
        })

        // Send Discord Notification 
        try {
            await discord.sendDepositAlert({
                userEmail: session.user.email || 'Unknown',
                amount,
                utr: `${utr} ${screenshotUrl ? '(Screenshot Uploaded)' : ''}`
            })
        } catch (discordError) {
            console.error("Discord alert failed:", discordError)
        }

        return NextResponse.json({ success: true, paymentId: payment.id })
    } catch (error) {
        console.error("Wallet deposit error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
