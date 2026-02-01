// backend-nest/src/config/logger.ts
type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function base(level: LogLevel, action: string, payload?: LogPayload): void {
  const ts = new Date().toISOString();
  const out = { ts, level, action, ...(payload ?? {}) };

  if (level === "error") console.error(action, out);
  else if (level === "warn") console.warn(action, out);
  else console.log(action, out);
}

export const logger = {
  info(action: string, payload?: LogPayload) {
    base("info", action, payload);
  },
  warn(action: string, payload?: LogPayload) {
    base("warn", action, payload);
  },
  error(action: string, payload?: LogPayload) {
    base("error", action, payload);
  },
} as const;
