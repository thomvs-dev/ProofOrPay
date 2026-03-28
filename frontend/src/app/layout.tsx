import type { Metadata } from "next";
import "./globals.css";
import WalletConnect, {
  WalletProvider,
  WalletBanner,
} from "@/components/WalletConnect";

export const metadata: Metadata = {
  title: "Pact Protocol — On-chain accountability (Stellar)",
  description:
    "Stake your word. Ship or lose. AI-verified accountability pools on Soroban testnet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stellar-dark text-gray-100">
        <WalletProvider>
          <nav className="border-b border-stellar-border sticky top-0 z-50 bg-stellar-dark/95 backdrop-blur">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
              <span className="font-bold text-white">Pact Protocol</span>
              <WalletConnect />
            </div>
          </nav>
          <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <WalletBanner />
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
