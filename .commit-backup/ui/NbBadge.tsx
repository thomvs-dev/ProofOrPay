const variants = {
  yellow: "nb-badge-yellow",
  green: "nb-badge-green",
  pink: "nb-badge-pink",
  orange: "nb-badge-orange",
  muted: "nb-badge-muted",
} as const;

type Variant = keyof typeof variants;

export function NbBadge({
  variant = "yellow",
  children,
  className = "",
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`${variants[variant]} ${className}`.trim()}>{children}</span>
  );
}
