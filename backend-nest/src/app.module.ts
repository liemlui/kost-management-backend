import { Module, type MiddlewareConsumer, type NestModule, RequestMethod } from "@nestjs/common";
import { AppController } from "./app.controller";
import { RequestLoggerMiddleware } from "./middlewares/requestLogger.middleware";
import { KostLocalsMiddleware } from "./middlewares/kostLocals.middleware";
import { KostModule } from "./modules/kost/kost.module";
import { WellKnownController } from "./controllers/wellKnown.controller";


@Module({
    imports: [KostModule],
  controllers: [AppController, WellKnownController],
  providers: []
})


export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");

    consumer
      .apply(KostLocalsMiddleware)
      .forRoutes(
        { path: "admin/kost", method: RequestMethod.ALL },
        { path: "admin/kost/*path", method: RequestMethod.ALL }
      );
  }
}