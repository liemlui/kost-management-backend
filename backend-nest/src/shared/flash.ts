// backend-nest/src/shared/flash.ts
import type { Request } from "express";

export type FlashState = {
  success: string | null;
  error: string | null;
  info: string | null;
  warnings: string[];
  errors: string[];
  form: Record<string, unknown> | null;
};

// Legacy formats we still accept (backward-compat)
type LegacyFlashOne = { type?: unknown; message?: unknown };
type LegacyFlashMany = { type?: unknown; messages?: unknown };

// New-ish raw shape (might come from future controllers)
type RawFlashLike = Partial<FlashState> & {
  warnings?: unknown;
  errors?: unknown;
  form?: unknown;
};

type SessionWithFlash = {
  flash?: unknown;
  save?: (cb: (err?: unknown) => void) => void;
};

type ReqWithSession = Request & {
  session?: SessionWithFlash;
  sessionID?: string;
};

export function defaultFlash(): FlashState {
  return {
    success: null,
    error: null,
    info: null,
    warnings: [],
    errors: [],
    form: null,
  };
}

function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function toStrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => toStr(x))
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Normalize flash from:
 * - new contract: { success, error, info, warnings[], errors[], form }
 * - old contract: { type, message }
 * - old errors:   { type: 'danger', messages: [...] }
 */
export function normalizeFlash(raw: unknown): FlashState {
  const f = defaultFlash();
  if (!raw) return f;

  if (isRecord(raw)) {
    const r = raw as RawFlashLike;

    // if it looks like new contract (any known keys exist)
    const hasNewKeys =
      "success" in r || "error" in r || "info" in r || "warnings" in r || "errors" in r || "form" in r;

    if (hasNewKeys) {
      return {
        success: toStr(r.success) ?? null,
        error: toStr(r.error) ?? null,
        info: toStr(r.info) ?? null,
        warnings: Array.isArray(r.warnings) ? toStrArray(r.warnings) : f.warnings,
        errors: Array.isArray(r.errors) ? toStrArray(r.errors) : f.errors,
        form: isRecord(r.form) ? (r.form as Record<string, unknown>) : null,
      };
    }

    // legacy: { type, message }
    const legacyOne = raw as LegacyFlashOne;
    const t = toStr(legacyOne.type)?.toLowerCase() ?? null;
    const msg = toStr(legacyOne.message);

    if (t && msg) {
      if (t === "success") f.success = msg;
      else if (t === "danger" || t === "error") f.error = msg;
      else if (t === "warning") f.warnings = [msg];
      else f.info = msg;
      return f;
    }

    // legacy errors: { type, messages: [...] }
    const legacyMany = raw as LegacyFlashMany;
    const msgs = isRecord(raw) ? (raw as any).messages : undefined;
    if (Array.isArray(msgs)) {
      f.errors = toStrArray(msgs);
      return f;
    }
  }

  return f;
}

function saveSession(req: ReqWithSession): Promise<void> {
  return new Promise((resolve) => {
    const s = req.session;
    if (!s || typeof s.save !== "function") return resolve();
    s.save(() => resolve());
  });
}

export async function setFlash(
  req: ReqWithSession,
  type: "success" | "error" | "danger" | "warning" | "info",
  message: string,
  form: Record<string, unknown> | null = null,
): Promise<void> {
  if (!req.session) return;

  const f = defaultFlash();
  const t = String(type || "").toLowerCase();

  if (t === "success") f.success = message;
  else if (t === "danger" || t === "error") f.error = message;
  else if (t === "warning") f.warnings = [message];
  else f.info = message;

  if (form) f.form = form;

  req.session.flash = f;
  await saveSession(req);
}

export async function setFlashErrors(
  req: ReqWithSession,
  errors: string[] | string,
  form: Record<string, unknown> | null = null,
): Promise<void> {
  if (!req.session) return;

  const f = defaultFlash();
  const list = Array.isArray(errors) ? errors : [errors];
  f.errors = list.map((x) => String(x)).filter((x) => x.trim().length > 0);

  if (form) f.form = form;

  req.session.flash = f;
  await saveSession(req);
}

/**
 * Pop flash (read once) and clear from session.
 * Controllers call this before render.
 */
export function getFlash(req: ReqWithSession): FlashState {
  if (!req.session) return defaultFlash();

  const raw = req.session.flash;
  req.session.flash = null;

  return normalizeFlash(raw);
}
