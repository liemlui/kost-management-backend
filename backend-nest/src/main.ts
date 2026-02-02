import "reflect-metadata";
import "./config/env";
import path from "path";
import session from "express-session";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ENV } from "./config/env";
import { ErrorHandlerFilter } from "./middlewares/errorHandler.filter";


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.useGlobalFilters(new ErrorHandlerFilter());
  app.use(helmet());

  app.use(
    session({
      name: "pwe.sid",
      secret: process.env.SESSION_SECRET || "dev-secret-change-this",
      resave: true,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax" }
    })
  );

  // Views & static
const isProd = process.env.NODE_ENV === "production";
const rootDir = process.cwd();

const viewsDir = path.join(rootDir, isProd ? "dist/views" : "src/views");
const publicDir = path.join(rootDir, isProd ? "dist/public" : "src/public");

// Views & static
app.useStaticAssets(publicDir);
app.setBaseViewsDir(viewsDir);
app.setViewEngine("ejs");

  const port = ENV.PORT || 3000;
  await app.listen(port);

  console.log(`✅ backend-nest running: http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error("❌ server boot failed", err);
  process.exit(1);
});
