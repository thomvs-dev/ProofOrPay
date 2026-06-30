"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import WalletConnect from "@/components/WalletConnect";
import { useWallet } from "@/components/WalletConnect";

const APP_LINKS = [
  { href: "/pools", label: "Pools" },
  { href: "/app", label: "App" },
  { href: "/proofs", label: "Proofs" },
  { href: "/metrics", label: "Metrics" },
] as const;

const LANDING_LINKS = [
  ...APP_LINKS,
  { href: "/#how-it-works", label: "How it works" },
] as const;

export function AppNavbar({ variant = "landing" }: { variant?: "landing" | "app" }) {
  const links = variant === "landing" ? LANDING_LINKS : APP_LINKS;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { publicKey, connect, isConnecting } = useWallet();
  const menuRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    firstLinkRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open]);

  const cta = publicKey ? (
    <Link
      href="/app"
      className="text-base sm:text-lg text-black underline underline-offset-2 hover:opacity-60 transition-opacity landing-font-body"
    >
      Launch app
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => connect()}
      disabled={isConnecting}
      className="text-base sm:text-lg text-black underline underline-offset-2 hover:opacity-60 transition-opacity landing-font-body disabled:opacity-50"
    >
      {isConnecting ? "Connecting…" : "Connect wallet"}
    </button>
  );

  const navPosition =
    variant === "landing"
      ? "fixed top-0 left-0 right-0 z-10"
      : "sticky top-0 z-50 bg-pop-bg/90 backdrop-blur-md border-b border-black/5";

  const linkClass = (href: string) => {
    const active =
      pathname === href || (href !== "/" && href !== "/#how-it-works" && pathname.startsWith(href));
    return active ? "opacity-100 font-medium" : "hover:opacity-60 transition-opacity";
  };

  return (
    <>
      <nav
        className={`${navPosition} px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between landing-font-body`}
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="text-[21px] sm:text-[26px] tracking-tight text-black landing-font-heading">
            ProofOrPay®
          </span>
          <span
            className="text-[25px] sm:text-[30px] text-black select-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            ✳︎
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0 text-base sm:text-lg text-black">
          {links.map((link, i) => (
            <span key={link.href} className="inline-flex items-center">
              {i > 0 && <span className="mx-1">,</span>}
              <Link href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            </span>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {cta}
          {variant === "app" && <WalletConnect />}
        </div>

        <button
          type="button"
          className="md:hidden flex flex-col gap-[5px] p-2"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`w-6 h-[2px] bg-black transition-all duration-300 origin-center ${
              open ? "rotate-45 translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-black transition-all duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-black transition-all duration-300 origin-center ${
              open ? "-rotate-45 -translate-y-[7px]" : ""
            }`}
          />
        </button>
      </nav>

      <div
        ref={menuRef}
        className={`fixed inset-0 z-[9] bg-white/95 backdrop-blur-sm flex flex-col justify-center px-8 gap-8 md:hidden transition-opacity duration-300 landing-font-body ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {links.map((link, i) => (
          <Link
            key={link.href}
            ref={i === 0 ? firstLinkRef : undefined}
            href={link.href}
            onClick={close}
            className={`text-[28px] text-black hover:opacity-60 transition-opacity landing-font-heading ${linkClass(link.href)}`}
          >
            {link.label}
          </Link>
        ))}
        <div onClick={close} className="space-y-4">
          {cta}
          {variant === "app" && <WalletConnect />}
        </div>
      </div>
    </>
  );
}
