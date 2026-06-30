"use client";

import Link from "next/link";
import WalletConnect, { WalletBanner } from "@/components/WalletConnect";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="sticky top-0 z-50 bg-nb-bg border-b-3 border-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-black text-lg uppercase tracking-tight text-nb-yellow hover:text-white transition-colors"
          >
            PROOF<span className="text-white">ORPAY</span>
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
    </>
  );
}