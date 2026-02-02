import { query } from "../../../db/pool";
import { roomTypesSql } from "./roomTypes.sql";

export class RoomTypesRepo {
  async listRoomTypes() {
    const r = await query(roomTypesSql.listRoomTypes, []);
    return r.rows;
  }

  async listActiveRoomTypes() {
    const r = await query(roomTypesSql.listActiveRoomTypes, []);
    return r.rows;
  }
}
