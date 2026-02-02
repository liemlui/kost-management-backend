import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { RequestLoggerMiddleware } from "./middlewares/requestLogger.middleware";
import { KostLocalsMiddleware } from "./middlewares/kostLocals.middleware";
import { KostModule } from "./modules/kost/kost.module";


@Module({
    imports: [KostModule],
  controllers: [AppController],
  providers: []
})


export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
    consumer.apply(KostLocalsMiddleware).forRoutes("admin/kost/(.*)");

  }
}