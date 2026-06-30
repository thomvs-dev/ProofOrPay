import type { HTMLAttributes, ReactNode } from "react";

const accents = {
  default: "nb-card",
  yellow: "nb-card-yellow",
  pink: "nb-card-pink",
  green: "nb-card-green",
  orange: "nb-card-orange",
  blue: "nb-card-blue",
} as const;

type Accent = keyof typeof accents;

export function NbCard({
  accent = "default",
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  accent?: Accent;
  children: ReactNode;
}) {
  return (
    <div className={`${accents[accent]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
