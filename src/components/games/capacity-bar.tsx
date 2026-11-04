import { cn } from "@/lib/utils";

// Above this many spots, segments get too thin to read, so a plain bar is used.
const MAX_SEGMENTS = 24;

/** How full a game is: one segment per spot, gold when taken. */
export function CapacityBar({
  taken,
  max,
  className,
}: {
  taken: number;
  max: number;
  className?: string;
}) {
  const label = `${taken} places prises sur ${max}`;

  if (max > MAX_SEGMENTS) {
    return (
      <div role="img" aria-label={label} className={cn("h-2 rounded-full bg-border", className)}>
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, (taken / max) * 100)}%` }}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("grid gap-1", className)}
      style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cn("h-2 rounded-[3px]", i < taken ? "bg-primary" : "bg-border")} />
      ))}
    </div>
  );
}
