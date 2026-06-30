import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletConnect";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProofOrPay — Stake Your Word. Ship or Lose.",
  description:
    "Create accountability pools, stake testnet XLM, submit proofs, get AI scores, vouch for peers — all on Soroban.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://db.onlinewebfonts.com/c/5ac3fe7c6abd2f62067f266d89671492?family=HelveticaNowDisplay-Medium"
        />
        <link
          rel="stylesheet"
          href="https://db.onlinewebfonts.com/c/1aa3377e489837a26d019bba501e779d?family=HelveticaNowDisplayW01-Rg"
        />
      </head>
      <body className="min-h-screen bg-nb-bg text-nb-white">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
