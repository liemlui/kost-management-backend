import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { todayISO_WIB } from "../shared/dates";
import {
  fmtIDR,
  roomStatusBadgeClass,
  amenityConditionBadgeClass,
  fmtDateISO,
} from "../shared/viewHelpers";

@Injectable()
export class KostLocalsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    res.locals.todayISO = todayISO_WIB();

    if (typeof res.locals.title === "undefined") {
      res.locals.title = "Kost Admin";
    }

    // helpful for nav active state
    res.locals.currentPath = req.originalUrl || req.path || "";

    // helpers for views (EJS)
    res.locals.roomStatusBadgeClass = roomStatusBadgeClass;
    res.locals.amenityConditionBadgeClass = amenityConditionBadgeClass;
    res.locals.fmtIDR = fmtIDR;
    res.locals.fmtDateISO = fmtDateISO;

    next();
  }
}
