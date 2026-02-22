// backend-nest/src/shared/parsers.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

export type ParseIssue = {
  field: string;
  message: string;
};

export class ValidationError extends Error {
  public readonly name = "ValidationError";
  public readonly issues: ParseIssue[];

  constructor(message: string, issues: ParseIssue[]) {
    super(message);
    this.issues = issues;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function trimOrNull(v: unknown): string | null {
  const s = asString(v);
  if (s === null) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

function pushIssue(issues: ParseIssue[], field: string, message: string) {
  issues.push({ field, message });
}

export type IntOpts = {
  min?: number;
  max?: number;
};

export type NumOpts = {
  min?: number;
  max?: number;
  allowFloat?: boolean; // default true
};

export function optionalString(v: unknown): string | null {
  return trimOrNull(v);
}

export function requiredString(v: unknown, field: string): string {
  const issues: ParseIssue[] = [];
  const t = trimOrNull(v);
  if (t === null) {
    pushIssue(issues, field, "is required");
    throw new ValidationError("validation failed", issues);
  }
  return t;
}

export function optionalInt(v: unknown, opts: IntOpts = {}): number | null {
  const t = trimOrNull(v);
  if (t === null) return null;

  // only digits with optional leading minus
  if (!/^-?\d+$/.test(t)) return null;

  const n = Number(t);
  if (!Number.isInteger(n)) return null;

  if (opts.min !== undefined && n < opts.min) return null;
  if (opts.max !== undefined && n > opts.max) return null;

  return n;
}

export function requiredInt(v: unknown, field: string, opts: IntOpts = {}): number {
  const issues: ParseIssue[] = [];
  const n = optionalInt(v, opts);
  if (n === null) {
    pushIssue(issues, field, "must be an integer");
    throw new ValidationError("validation failed", issues);
  }
  return n;
}

export function optionalNumber(v: unknown, opts: NumOpts = {}): number | null {
  const t = trimOrNull(v);
  if (t === null) return null;

  // allowFloat default = true
  const allowFloat = opts.allowFloat !== false;

  // Accept typical HTML number inputs, including decimals (.)
  // Reject commas to avoid locale ambiguity ("1,000" etc).
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;

  const n = Number(t);
  if (!Number.isFinite(n)) return null;

  if (!allowFloat && !Number.isInteger(n)) return null;

  if (opts.min !== undefined && n < opts.min) return null;
  if (opts.max !== undefined && n > opts.max) return null;

  return n;
}

export function requiredNumber(v: unknown, field: string, opts: NumOpts = {}): number {
  const issues: ParseIssue[] = [];
  const n = optionalNumber(v, opts);
  if (n === null) {
    pushIssue(issues, field, "must be a number");
    throw new ValidationError("validation failed", issues);
  }
  return n;
}

/**
 * Checkbox / toggle parser for HTML forms.
 */
export function checkboxToBool(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;

  if (typeof v === "number") return v === 1;

  const t = trimOrNull(v);
  if (t === null) return false;

  const s = t.toLowerCase();
  if (s === "on" || s === "true" || s === "1" || s === "yes") return true;
  if (s === "off" || s === "false" || s === "0" || s === "no") return false;

  return false;
}

export function optionalDateISO(v: unknown): string | null {
  const t = trimOrNull(v);
  if (t === null) return null;

  // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;

  // Validate actual calendar date
  const [yStr, mStr, dStr] = t.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (m < 1 || m > 12) return null;

  const dt = new Date(Date.UTC(y, m - 1, d));
  const yy = dt.getUTCFullYear();
  const mm = dt.getUTCMonth() + 1;
  const dd = dt.getUTCDate();

  if (yy !== y || mm !== m || dd !== d) return null;

  return t;
}

export function requiredDateISO(v: unknown, field: string): string {
  const issues: ParseIssue[] = [];
  const d = optionalDateISO(v);
  if (d === null) {
    pushIssue(issues, field, "must be a valid YYYY-MM-DD date");
    throw new ValidationError("validation failed", issues);
  }
  return d;
}

export function parseEnum<T extends string>(
  v: unknown,
  field: string,
  allowed: readonly T[],
): T {
  const issues: ParseIssue[] = [];
  const t = trimOrNull(v);
  if (t === null) {
    pushIssue(issues, field, "is required");
    throw new ValidationError("validation failed", issues);
  }
  const hit = allowed.find((x) => x === t);
  if (!hit) {
    pushIssue(issues, field, `must be one of: ${allowed.join(", ")}`);
    throw new ValidationError("validation failed", issues);
  }
  return hit;
}

export function parsePaging(
  input: unknown,
  maxLimit = 200,
): { page: number; limit: number; offset: number } {
  let page = 1;
  let limit = 20;

  if (isRecord(input)) {
    const p = optionalInt(input.page, { min: 1 });
    const l = optionalInt(input.limit, { min: 1, max: maxLimit });
    if (p !== null) page = p;
    if (l !== null) limit = l;
  }

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function collectValidation(run: (issues: ParseIssue[]) => void): void {
  const issues: ParseIssue[] = [];
  run(issues);
  if (issues.length > 0) {
    throw new ValidationError("validation failed", issues);
  }
}

export function safeParse<T>(
  fn: () => T,
): { ok: true; value: T } | { ok: false; error: ValidationError } {
  try {
    return { ok: true, value: fn() };
  } catch (e: unknown) {
    if (e instanceof ValidationError) return { ok: false, error: e };
    throw e;
  }
}

export function optionalSelectInt(v: unknown, opts: IntOpts = {}): number | null {
  const t = trimOrNull(v);
  if (t === null) return null;
  if (t.toLowerCase() === "false") return null; // legacy select placeholder
  return optionalInt(t, opts);
}

export function requiredSelectInt(v: unknown, field: string, opts: IntOpts = {}): number {
  const issues: ParseIssue[] = [];
  const n = optionalSelectInt(v, opts);
  if (n === null) {
    pushIssue(issues, field, "must be selected");
    throw new ValidationError("validation failed", issues);
  }
  return n;
}
