const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * DAY],
  ["month", 30 * DAY],
  ["week", 7 * DAY],
  ["day", DAY],
  ["hour", HOUR],
  ["minute", MINUTE],
];

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago". `now` is passed in so callers control when time is read. */
export function relativeTime(timestamp: number, now: number): string {
  const seconds = Math.max(0, (now - timestamp) / 1000);
  if (seconds < MINUTE) return "just now";
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return relativeFormat.format(-Math.floor(seconds / size), unit);
  }
  return "just now";
}

/** Size of the note body in kilobytes, measured as UTF-8. */
export function formatSize(content: string): string {
  const bytes = new TextEncoder().encode(content).byteLength;
  if (bytes === 0) return "0 KB";
  return `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`;
}
