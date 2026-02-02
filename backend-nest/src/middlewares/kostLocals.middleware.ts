import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { todayISO_WIB } from "../shared/dates";
import { roomStatusBadgeClass } from "../shared/viewHelpers";
import { fmtIDR } from "../shared/viewHelpers";


@Injectable()
export class KostLocalsMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction): void {
    res.locals.todayISO = todayISO_WIB();

    if (typeof res.locals.title === "undefined") {
      res.locals.title = "Kost Admin";
    }
    res.locals.roomStatusBadgeClass = roomStatusBadgeClass;
    res.locals.fmtIDR = fmtIDR;


    next();
  }
}
