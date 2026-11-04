// Game times are stored in UTC and shown in the app's time zone.

/** Milliseconds the time zone is ahead of UTC at the given instant. */
function offsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/** "2026-11-08T10:00" typed in `timeZone` → the matching UTC instant. */
export function fromLocalInput(value: string, timeZone: string): Date {
  const naive = new Date(`${value}Z`);
  if (Number.isNaN(naive.getTime())) return naive;
  const guess = new Date(naive.getTime() - offsetMs(naive, timeZone));
  // Re-check with the offset at the result, which differs near DST changes.
  return new Date(naive.getTime() - offsetMs(guess, timeZone));
}

/** UTC instant → "2026-11-08T10:00" in `timeZone`, for datetime-local inputs. */
export function toLocalInput(date: Date, timeZone: string): string {
  return new Date(date.getTime() + offsetMs(date, timeZone)).toISOString().slice(0, 16);
}

export function formatGameDate(date: Date, timeZone: string): string {
  const text = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type DateParts = {
  weekday: string; // "Dimanche"
  weekdayShort: string; // "DIM"
  day: string; // "8"
  month: string; // "novembre"
  monthShort: string; // "NOV", "JUIN", "JUIL"
  time: string; // "17:00"
};

/** The pieces the game cards and headers lay out separately. */
export function dateParts(date: Date, timeZone: string): DateParts {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { timeZone, ...options }).format(date);
  const weekday = part({ weekday: "long" });
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    weekdayShort: weekday.slice(0, 3).toUpperCase(),
    day: part({ day: "numeric" }),
    month: part({ month: "long" }),
    monthShort: part({ month: "short" }).replace(".", "").toUpperCase(),
    time: part({ hour: "2-digit", minute: "2-digit" }),
  };
}
