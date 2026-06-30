"use client";

import { ipfsGatewayUrl } from "@/lib/ipfs";

export function IpfsImage({
  cid,
  alt,
  className = "",
  fallbackClassName = "bg-gradient-to-br from-nb-pink/30 via-nb-yellow/20 to-nb-green/30",
}: {
  cid: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const src = ipfsGatewayUrl(cid);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center ${fallbackClassName} ${className}`}
        aria-hidden
      >
        <span className="text-4xl opacity-40">✳︎</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
