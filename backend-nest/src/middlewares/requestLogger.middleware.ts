// backend-nest/src/middlewares/requestLogger.middleware.ts
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { logger } from "../config/logger"; // ✅ NEW

type LogLevel = "info" | "warn" | "error";

function nowMs(): number {
  return Date.now();
}

function safeString(v: unknown, max = 300): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  return s.length <= max ? s : s.slice(0, max) + "…";
}

function toInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function getClientIp(req: Request): string | null {
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


@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = nowMs();

    const requestId = randomUUID();
    res.setHeader("x-request-id", requestId);
    res.locals.requestId = requestId;

    const method = req.method;
    const path = req.originalUrl || req.url;



    res.on("finish", () => {
      const ms = nowMs() - start;
      const status = res.statusCode;

      const contentLength =
        typeof res.getHeader("content-length") === "string"
          ? toInt(res.getHeader("content-length"))
          : toInt(res.getHeader("content-length"));

      const meta = {
        method,
        path,
        status,
        ms, // ✅ keep legacy name "ms" (match legacy)
        request_id: requestId,
        ip: getClientIp(req),
        ua: safeString(req.headers["user-agent"]),
        referer: safeString(req.headers["referer"]),
        content_length: contentLength,
      };

      const lvl = levelFromStatus(status);
      if (lvl === "error") logger.error("http.request", meta);
      else if (lvl === "warn") logger.warn("http.request", meta);
      else logger.info("http.request", meta);
    });

    next();
  }
}
