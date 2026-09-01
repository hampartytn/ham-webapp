export function RouteFallback() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      <span className="size-4 animate-pulse rounded-full bg-muted-foreground/40" />
    </div>
  );
}
