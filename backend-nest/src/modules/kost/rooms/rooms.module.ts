import { Module } from "@nestjs/common";
import { RoomsController } from "./rooms.controller";
import { RoomsRepo } from "./rooms.repo";
import { RoomAmenitiesRepo } from "./roomAmenities.repo";
import { RoomTypesModule } from "./roomTypes.module";

@Module({
  imports: [RoomTypesModule],
  controllers: [RoomsController],
  providers: [RoomsRepo, RoomAmenitiesRepo],
})
export class RoomsModule {}
