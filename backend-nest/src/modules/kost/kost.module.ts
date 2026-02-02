// pwe/backend-nest/src/modules/kost/kost.module.ts

import { Module } from "@nestjs/common";
import { RoomsModule } from "./rooms/rooms.module";
import { RoomTypesModule } from "./rooms/roomTypes.module";

@Module({
  imports: [RoomsModule, RoomTypesModule],
})
export class KostModule {}
