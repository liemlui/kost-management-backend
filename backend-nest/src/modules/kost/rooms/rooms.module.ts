import { Module } from "@nestjs/common";
import { RoomsController } from "./rooms.controller";
import { RoomsRepo } from "./rooms.repo";
import { RoomTypesModule } from "../roomTypes/roomTypes.module";

@Module({
  imports: [RoomTypesModule],
  controllers: [RoomsController],
  providers: [RoomsRepo],
})
export class RoomsModule {}
