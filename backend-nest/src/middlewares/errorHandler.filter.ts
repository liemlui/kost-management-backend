// backend-nest/src/middlewares/errorHandler.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { logger } from "../config/logger";

function getStatusFromUnknown(err: unknown, res: Response): number {
  if (err instanceof HttpException) return err.getStatus();

  const anyErr = err as any;
  return (
    anyErr?.status ||
    anyErr?.statusCode ||
    res.statusCode ||
    500
  );
}

@Catch()
export class ErrorHandlerFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status = getStatusFromUnknown(exception, res);

    const anyErr = exception as any;
    const message =
      (exception instanceof HttpException
        ? exception.message
        : anyErr?.message) || "Unknown error";

    const stack: string | null =
      process.env.NODE_ENV === "production" ? null : (anyErr?.stack ?? null);

    logger.error("http.error", {
      method: req.method,
      path: req.path,
      message,
      status,
      stack,
      sessionId: req.sessionID ? String(req.sessionID).slice(0, 10) + "..." : null,
      sessionHasFlash: !!(req.session as any)?.flash,
      requestId: req.headers["x-request-id"] ?? null,
    });

    // kalau response sudah mulai dikirim, jangan render lagi
    if (res.headersSent) return;

    res.status(status);

    return res.render("error", {
      title: "Error",
      status,
      path: req.originalUrl || req.path,
      requestId: req.headers["x-request-id"] || null,
      message,
      stack,
    });
  }
}
