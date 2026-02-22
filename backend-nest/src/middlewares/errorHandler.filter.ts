// backend-nest/src/middlewares/errorHandler.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { logger } from "../config/logger";

type SessionMaybeFlash = {
  flash?: unknown;
};

type ReqWithSessionMaybe = Request & {
  session?: SessionMaybeFlash;
  sessionID?: string;
};

type ResWithLocals = Response & {
  locals: {
    requestId?: string;
  };
};

type LogLevel = "info" | "warn" | "error";

function getStatusFromUnknown(err: unknown, res: Response): number {
  if (err instanceof HttpException) return err.getStatus();

  const anyErr = err as { status?: unknown; statusCode?: unknown };
  const status = anyErr?.status ?? anyErr?.statusCode ?? res.statusCode ?? 500;

  const n = typeof status === "number" ? status : Number(status);
  return Number.isFinite(n) ? n : 500;
}

function levelFromStatus(status: number): LogLevel {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  return "info";
}

function isNoisyWellKnownPath(path: string | undefined | null): boolean {
  if (!path) return false;
  return path.startsWith("/.well-known/appspecific/");
}

function getRequestId(req: Request, res: ResWithLocals): string | null {
  // Prefer res.locals (set by RequestLoggerMiddleware)
  if (typeof res.locals?.requestId === "string" && res.locals.requestId) {
    return res.locals.requestId;
  }

  // Fallback: inbound header (if any)
  const h = req.headers["x-request-id"];
  return typeof h === "string" && h ? h : null;
}

@Catch()
export class ErrorHandlerFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<ReqWithSessionMaybe>();
    const res = ctx.getResponse<ResWithLocals>();

    const status = getStatusFromUnknown(exception, res);

    /**
     * Chrome DevTools sometimes probes:
     *   /.well-known/appspecific/com.chrome.devtools.json
     *
     * We don't want this to:
     * - render an error page
     * - produce extra "noise" logs
     *
     * So: convert 404 -> 204 and end. (RequestLogger will still log 204 once.)
     */
    if (status === 404 && isNoisyWellKnownPath(req.path)) {
      if (!res.headersSent) res.status(204).end();
      return;
    }

    const anyErr = exception as { message?: unknown; stack?: unknown };

    const message =
      (exception instanceof HttpException
        ? exception.message
        : typeof anyErr?.message === "string"
          ? anyErr.message
          : null) || "Unknown error";

    const stack: string | null =
      process.env.NODE_ENV === "production"
        ? null
        : typeof anyErr?.stack === "string"
          ? anyErr.stack
          : null;

    const requestId = getRequestId(req, res);
    const hasFlash = !!req.session?.flash;

    const level = levelFromStatus(status);

    const payload = {
      method: req.method,
      path: req.path,
      message,
      status,
      stack,
      sessionId: req.sessionID ? String(req.sessionID).slice(0, 10) + "..." : null,
      sessionHasFlash: hasFlash,
      request_id: requestId,
    };

    if (level === "error") logger.error("http.error", payload);
    else if (level === "warn") logger.warn("http.warn", payload);
    else logger.info("http.info", payload);

    if (res.headersSent) return;

    res.status(status);

    return res.render("error", {
      title: "Error",
      status,
      path: req.originalUrl || req.path,
      requestId: requestId || null,
      message,
      stack,
    });
  }
}
