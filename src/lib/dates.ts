// Date helpers for admin reports. All ranges are whole days in India time.

const IST_OFFSET_MS = 5.5 * 3600 * 1000;
const isYmd = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function todayYmd() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function monthStartYmd() {
  return todayYmd().slice(0, 8) + "01";
}

export function dayStart(ymd: string) {
  return new Date(`${ymd}T00:00:00+05:30`);
}

export function dayEnd(ymd: string) {
  return new Date(`${ymd}T23:59:59.999+05:30`);
}

// Reads ?from=&to= (YYYY-MM-DD), defaulting to the current month so far.
export function rangeFromParams(params: { from?: string; to?: string }) {
  const from = isYmd(params.from) ? params.from! : monthStartYmd();
  const to = isYmd(params.to) ? params.to! : todayYmd();
  return { from, to, gte: dayStart(from), lte: dayEnd(to) };
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
