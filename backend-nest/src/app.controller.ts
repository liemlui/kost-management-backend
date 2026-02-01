import { Controller, Get, Render } from "@nestjs/common";
import { pingDb } from "./db/pool";


@Controller()
export class AppController {
  @Get("/health")
  health() {
    return { ok: true };
  }

  @Get("/health/db")
  async healthDb() {
    const r = await pingDb();
    return { ok: true, db: r };
  }

  @Get("/admin/kost")
  @Render("pages/home")
  home() {
    return { title: "Kost Admin (Nest)" };
  }
}
