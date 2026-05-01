import type { Metadata } from "next";
import Link from "next/link";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import WalletConnect, {
  WalletProvider,
  WalletBanner,
} from "@/components/WalletConnect";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pact Protocol — Stake Your Word. Ship or Lose.",
  description:
    "Create accountability pools, stake testnet XLM, submit proofs, get AI scores, vouch for peers — all on Soroban.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <body className="min-h-screen bg-nb-bg text-nb-white">
        <WalletProvider>
          <nav className="sticky top-0 z-50 bg-nb-bg border-b-3 border-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
              <Link
                href="/"
                className="font-black text-lg uppercase tracking-tight text-nb-yellow hover:text-white transition-colors"
              >
                PACT <span className="text-white">PROTOCOL</span>
              </Link>
              <div className="flex items-center gap-1 sm:gap-2 text-sm">
                <Link
                  href="/pools"
                  className="px-3 py-1.5 font-bold uppercase tracking-wide text-xs text-white hover:text-nb-yellow border-2 border-transparent hover:border-nb-yellow transition-all"
                >
                  Pools
                </Link>
                <Link
                  href="/metrics"
                  className="px-3 py-1.5 font-bold uppercase tracking-wide text-xs text-white hover:text-nb-green border-2 border-transparent hover:border-nb-green transition-all hidden sm:block"
                >
                  Metrics
                </Link>
                <Link
                  href="/app"
                  className="px-3 py-1.5 font-bold uppercase tracking-wide text-xs text-white hover:text-nb-green border-2 border-transparent hover:border-nb-green transition-all"
                >
                  Launch App
                </Link>
                <WalletConnect />
              </div>
            </div>
          </nav>
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <WalletBanner />
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
