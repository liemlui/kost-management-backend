import { query } from "../../../db/pool";
import { roomTypesSql } from "./roomTypes.sql";

export class RoomTypesRepo {
  async listRoomTypes(): Promise<any[]> {
    const r = await query(roomTypesSql.listRoomTypes, []);
    return r.rows;
  }

  async listActiveRoomTypes(): Promise<any[]> {
    const r = await query(roomTypesSql.listActiveRoomTypes, []);
    return r.rows;
  }
}
