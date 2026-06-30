import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  yellow: "nb-btn-yellow",
  ghost: "nb-btn-ghost",
  pink: "nb-btn-pink",
  green: "nb-btn-green",
  orange: "nb-btn-orange",
  blue: "nb-btn-blue",
} as const;

type Variant = keyof typeof variants;

type NbButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  href?: string;
  children: ReactNode;
  className?: string;
};

export function NbButton({
  variant = "yellow",
  loading = false,
  href,
  children,
  className = "",
  disabled,
  ...props
}: NbButtonProps) {
  const cls = `${variants[variant]} text-sm ${className}`.trim();
  const isDisabled = disabled || loading;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} disabled={isDisabled} {...props}>
      {loading ? "…" : children}
    </button>
  );
}
