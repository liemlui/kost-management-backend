import { Module } from "@nestjs/common";
import { RoomsModule } from "./rooms/rooms.module";
import { RoomTypesModule } from "./roomTypes/roomTypes.module";

@Module({
  imports: [RoomsModule, RoomTypesModule],
})
export class KostModule {}
