import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";

@Controller(".well-known/appspecific")
export class WellKnownController {
  @Get("com.chrome.devtools.json")
  chromeDevtools(@Res() res: Response): void {
    res.status(204).end();
  }
}
