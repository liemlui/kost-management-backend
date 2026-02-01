// backend-nest/src/middlewares/errorHandler.filter.ts
import { Catch, ExceptionFilter } from "@nestjs/common";
import type { Request, Response } from "express";
import { logger } from "../config/logger";

type SessionLike = {
  flash?: unknown;
};

type ReqWithSession = Request & {
  session?: SessionLike;
  sessionID?: string;
};

function safeSubSessionId(id: unknown): string | null {
  if (!id) return null;
  const s = String(id);
  return s.length > 10 ? s.substring(0, 10) + "..." : s;
}

@Catch()
export class ErrorHandlerFilter implements ExceptionFilter {
  catch(err: unknown, host: any) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<ReqWithSession>();
    const res = ctx.getResponse<Response>();

    // Determine status similar to legacy
    const anyErr = err as any;
    const status =
      (typeof anyErr?.status === "number" && anyErr.status) ||
      (typeof anyErr?.statusCode === "number" && anyErr.statusCode) ||
      (typeof res.statusCode === "number" && res.statusCode >= 400 ? res.statusCode : 500);

    const message = (anyErr?.message && String(anyErr.message)) || "Unknown error";
    const stack = anyErr?.stack ? String(anyErr.stack) : null;

    logger.error("http.error", {
      method: req.method,
      path: req.path,
      message,
      status,
      stack,
      sessionId: safeSubSessionId(req.sessionID),
      sessionHasFlash: !!req.session?.flash,
      requestId: (req.headers["x-request-id"] as string | undefined) || null,
    });

    // dont render if headers already sent
    if (res.headersSent) return;

    res.status(status);

    // SSOT: variables used by error.ejs
    // NOTE: keep keys aligned with legacy error handler
    return res.render("error", {
      title: "Error",
      status,
      path: req.originalUrl || req.path,
      requestId: (req.headers["x-request-id"] as string | undefined) || null,
      message,
      stack: process.env.NODE_ENV === "production" ? null : stack,
    });
  }
}
