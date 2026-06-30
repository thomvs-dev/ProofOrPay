export function NbSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-black/5 border border-black/10 rounded-2xl ${className}`.trim()}
      aria-hidden
    />
  );
}

export function PoolCardSkeleton() {
  return <NbSkeleton className="h-48 w-full" />;
}
