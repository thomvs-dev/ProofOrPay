"use client";

import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pop-divider">
      <div>
        {eyebrow && <p className="pop-page-eyebrow">{eyebrow}</p>}
        <h1 className="pop-page-title">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs rounded-full border px-3 py-1.5 transition-colors landing-font-body ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-black border-black/10 hover:bg-black hover:text-white hover:border-black"
      }`}
    >
      {children}
    </button>
  );
}
