// backend-nest/src/config/logger.ts

type LogLevel = "INFO" | "WARN" | "ERROR";

function log(level: LogLevel, msg: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  // eslint-disable-next-line no-console
  console.log(`[${ts}] [${level}] ${msg}${payload}`);
}

export const logger = {
  info: (msg: string, meta?: unknown) => log("INFO", msg, meta),
  warn: (msg: string, meta?: unknown) => log("WARN", msg, meta),
  error: (msg: string, meta?: unknown) => log("ERROR", msg, meta),
};
