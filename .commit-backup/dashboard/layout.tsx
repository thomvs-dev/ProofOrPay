"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletConnect, { WalletBanner } from "@/components/WalletConnect";

function NavLink({
  href,
  label,
  activeClass,
  idleClass,
}: {
  href: string;
  label: string;
  activeClass: string;
  idleClass: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`px-3 py-1.5 font-bold uppercase tracking-wide text-xs border-2 transition-all ${
        active ? activeClass : idleClass
      }`}
    >
      {label}
    </Link>
  );
}

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
            <NavLink
              href="/pools"
              label="Pools"
              activeClass="text-nb-yellow border-nb-yellow"
              idleClass="text-white hover:text-nb-yellow border-transparent hover:border-nb-yellow"
            />
            <NavLink
              href="/metrics"
              label="Metrics"
              activeClass="text-nb-green border-nb-green"
              idleClass="text-white hover:text-nb-green border-transparent hover:border-nb-green hidden sm:block"
            />
            <NavLink
              href="/app"
              label="Launch App"
              activeClass="text-nb-green border-nb-green"
              idleClass="text-white hover:text-nb-green border-transparent hover:border-nb-green"
            />
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
