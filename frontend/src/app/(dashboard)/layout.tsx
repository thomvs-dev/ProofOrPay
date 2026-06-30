"use client";

import { AppNavbar } from "@/components/AppNavbar";
import { WalletBanner } from "@/components/WalletConnect";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-font-body min-h-screen bg-pop-bg text-pop-text">
      <AppNavbar variant="app" />
      <main className="max-w-6xl mx-auto px-5 sm:px-8 md:px-10 py-8 sm:py-10">
        <WalletBanner />
        {children}
      </main>
    </div>
  );
}
