// backend-nest/src/shared/viewHelpers.ts

export function roomStatusBadgeClass(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "bg-success";
    case "MAINTENANCE":
      return "bg-warning text-dark";
    case "INACTIVE":
      return "bg-secondary";
    default:
      return "bg-light text-dark";
  }
}

export function fmtIDR(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}
