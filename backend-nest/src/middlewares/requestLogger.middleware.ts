// backend-nest/src/middlewares/requestLogger.middleware.ts
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { logger } from "../config/logger";

type LogLevel = "info" | "warn" | "error";

function nowMs(): number {
  return Date.now();
}

function safeString(v: unknown, max = 300): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function toInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function getClientIp(req: Request): string | null {
  // If you’re behind proxy/load balancer, you may enable trust proxy later.
  const xfwd = req.headers["x-forwarded-for"];
  if (typeof xfwd === "string" && xfwd.trim()) {
    const first = xfwd.split(",")[0]?.trim();
    return first || null;
  }
  return req.ip || null;
}

function levelFromStatus(statusCode: number): LogLevel {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
}

/**
 * Minimal structured request logger (no body logging).
 * - adds X-Request-Id
 * - logs on response finish
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = nowMs();

    const requestId = randomUUID();
    res.setHeader("X-Request-Id", requestId);
    res.locals.requestId = requestId;

    const method = req.method;
    const path = req.originalUrl || req.url;

    // log when response finished
    res.on("finish", () => {
      const durationMs = nowMs() - start;
      const statusCode = res.statusCode;

      const contentLength =
        typeof res.getHeader("content-length") === "string"
          ? toInt(res.getHeader("content-length"))
          : toInt(res.getHeader("content-length"));

      const log = {
        ts: new Date().toISOString(),
        level: levelFromStatus(statusCode),
        action: "http.request",
        request_id: requestId,
        method,
        path,
        status: statusCode,
        duration_ms: durationMs,
        ip: getClientIp(req),
        ua: safeString(req.headers["user-agent"]),
        referer: safeString(req.headers["referer"]),
        content_length: contentLength,
      };

      // For now: console.* (logger.ts can replace this later)
      if (log.level === "error") logger.error("http.request", log);
      else if (log.level === "warn") logger.warn("http.request", log);
      else logger.info("http.request", log);
    });

    next();
  }
}
