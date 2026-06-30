"use client";

import { useState } from "react";

const CONTACT_EMAIL = "hello@prooforpay.xyz";

function CopyIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="4" y="4" width="7" height="7" stroke="currentColor" strokeWidth="1" />
      <rect x="1" y="1" width="7" height="7" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function CopyContactPill({
  onCopied,
}: {
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center gap-2 sm:gap-3 text-white bg-transparent border border-white rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-white hover:text-black transition-colors duration-200 landing-font-body"
    >
      <span>
        Reach us:{" "}
        <span className="underline underline-offset-1">{CONTACT_EMAIL}</span>
      </span>
      <CopyIcon />
      {copied && (
        <span className="sr-only" role="status">
          Copied
        </span>
      )}
    </button>
  );
}
