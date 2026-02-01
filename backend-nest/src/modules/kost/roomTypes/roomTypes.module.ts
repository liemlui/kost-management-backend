import { Module } from "@nestjs/common";
import { RoomTypesRepo } from "./roomTypes.repo";

@Module({
  providers: [RoomTypesRepo],
  exports: [RoomTypesRepo],
})
export class RoomTypesModule {}
