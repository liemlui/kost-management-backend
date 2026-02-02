// backend-nest/src/shared/viewHelpers.ts

export function roomStatusBadgeClass(status: string): string {
  const s = String(status || "").toUpperCase();
  if (s === "AVAILABLE") return "text-bg-success";
  if (s === "MAINTENANCE") return "text-bg-warning";
  if (s === "INACTIVE") return "text-bg-secondary";
  return "text-bg-secondary";
}

export function amenityConditionBadgeClass(condition: string): string {
  const c = String(condition || "").toUpperCase();
  if (!c) return "text-muted";
  if (c === "NEW" || c === "GOOD") return "text-bg-success";
  if (c === "FAIR" || c === "DAMAGED") return "text-bg-warning";
  if (c === "MISSING") return "text-bg-danger";
  return "text-bg-secondary";
}

export function fmtIDR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return "Rp " + n.toLocaleString("id-ID");
}

export function fmtDateISO(value: unknown): string {
  if (!value) return "-";
  const s = String(value).slice(0, 10); // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return String(value);
}
