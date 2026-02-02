export function todayISO_WIB(): string {
  // WIB = UTC+7
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  const wib = new Date(utc + 7 * 60 * 60_000);

  const y = wib.getFullYear();
  const m = String(wib.getMonth() + 1).padStart(2, "0");
  const d = String(wib.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
