import { ShieldCheck } from "lucide-react"

export function Footer() {
    return (
        <footer className="border-t border-purple-500/10 bg-[#0a0a0f]/80 backdrop-blur-md py-8 mt-auto shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-zinc-500 text-sm">
                        © {new Date().getFullYear()} Primex Anarchy. All rights reserved.
                    </div>

                    <div className="flex items-center gap-3 bg-purple-500/5 px-4 py-2 rounded-lg border border-purple-500/10 shadow-inner">
                        <ShieldCheck className="h-5 w-5 text-purple-400" />
                        <div className="text-xs text-zinc-400 max-w-md">
                            <span className="font-semibold text-purple-300">Primex Anarchy</span> uses a secure automated payment system for instant funds.
                            All purchases help maintain server performance.
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
