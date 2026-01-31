import { Controller, Get, Render } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("/health")
  health() {
    return { ok: true };
  }

  @Get("/admin/kost")
  @Render("pages/home")
  home() {
    return { title: "Kost Admin (Nest)" };
  }
}
