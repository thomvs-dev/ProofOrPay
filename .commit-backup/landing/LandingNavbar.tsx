"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@/components/WalletConnect";

const NAV_LINKS = [
  { href: "/pools", label: "Pools" },
  { href: "/app", label: "App" },
  { href: "/metrics", label: "Metrics" },
  { href: "/#how-it-works", label: "How it works" },
] as const;

export function LandingNavbar() {
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
      className="text-[23px] text-black underline underline-offset-2 hover:opacity-60 transition-opacity landing-font-body"
    >
      Launch app
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => connect()}
      disabled={isConnecting}
      className="text-[23px] text-black underline underline-offset-2 hover:opacity-60 transition-opacity landing-font-body disabled:opacity-50"
    >
      {isConnecting ? "Connecting…" : "Connect wallet"}
    </button>
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-10 px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between landing-font-body">
        <Link href="/" className="flex items-center gap-3">
          <span
            className="text-[21px] sm:text-[26px] tracking-tight text-black landing-font-heading"
          >
            ProofOrPay®
          </span>
          <span
            className="text-[25px] sm:text-[30px] text-black select-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            ✳︎
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0 text-[23px] text-black">
          {NAV_LINKS.map((link, i) => (
            <span key={link.href} className="inline-flex items-center">
              {i > 0 && <span className="mx-1">,</span>}
              <Link
                href={link.href}
                className="hover:opacity-60 transition-opacity"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </div>

        <div className="hidden md:block">{cta}</div>

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
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.href}
            ref={i === 0 ? firstLinkRef : undefined}
            href={link.href}
            onClick={close}
            className="text-[32px] font-medium text-black hover:opacity-60 transition-opacity"
          >
            {link.label}
          </Link>
        ))}
        <div onClick={close}>{cta}</div>
      </div>
    </>
  );
}
