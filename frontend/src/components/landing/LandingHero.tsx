"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletConnect";
import { useTypewriter } from "@/hooks/useTypewriter";
import { CopyContactPill } from "./CopyContactPill";
import { useToast } from "@/components/ui/Toast";

const TYPEWRITER_TEXT =
  "Glad you stopped in. Good builders stake here. Now, what are we shipping?";

export function LandingHero() {
  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT);
  const { publicKey, connect, isConnecting } = useWallet();
  const { toast } = useToast();

  const [pillsVisible, setPillsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPillsVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const pillClass =
    "inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-black hover:text-white transition-colors duration-200 landing-font-body";

  return (
    <section className="relative z-[1] h-screen flex flex-col justify-end md:justify-center pb-12 md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden landing-font-body text-black">
      <div className="max-w-xl relative z-10">
        <p
          className="pointer-events-none select-none mb-5 sm:mb-6 text-black"
          style={{
            fontSize: "clamp(18px, 4vw, 26px)",
            lineHeight: 1.3,
            fontWeight: 400,
            filter: "blur(4px)",
          }}
        >
          Hey there, meet P.O.P,
          <br />
          ProofOrPay&apos;s On-chain Proof Protocol
        </p>

        <p
          className="mb-5 sm:mb-6 text-black"
          style={{
            fontSize: "clamp(18px, 4vw, 26px)",
            lineHeight: 1.35,
            fontWeight: 400,
            minHeight: "54px",
          }}
        >
          {displayed}
          {!done && (
            <span className="inline-block w-[2px] h-[1.1em] bg-black align-middle ml-[2px] typewriter-cursor" />
          )}
        </p>

        <div
          className={`flex flex-wrap gap-y-1 transition-all duration-400 ${
            pillsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}
        >
          <Link href="/app" className={pillClass}>
            Create a pool
          </Link>
          <Link href="/pools" className={pillClass}>
            Browse pools
          </Link>
          {publicKey ? (
            <Link href="/app" className={pillClass}>
              Launch app
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => connect()}
              disabled={isConnecting}
              className={`${pillClass} disabled:opacity-50`}
            >
              {isConnecting ? "Connecting…" : "Connect wallet"}
            </button>
          )}
          <a href="#how-it-works" className={pillClass}>
            See how it works
          </a>
          <CopyContactPill onCopied={() => toast("Email copied to clipboard")} />
        </div>
      </div>
    </section>
  );
}
