export function NbSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/10 border-3 border-white/20 ${className}`.trim()}
      aria-hidden
    />
  );
}

export function PoolCardSkeleton() {
  return (
    <NbSkeleton className="h-48 w-full" />
  );
}
