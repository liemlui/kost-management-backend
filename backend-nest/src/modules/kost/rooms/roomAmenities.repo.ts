import { query } from "../../../db/pool";
import { roomAmenitiesSql } from "./roomAmenities.sql";

function assertId(v: unknown, label: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw Object.assign(new Error(`Invalid id: ${label}`), { status: 400 });
  return n;
}

export class RoomAmenitiesRepo {
  async listRoomAmenities(roomId: number) {
    const rid = assertId(roomId, "kost.roomAmenities.listRoomAmenities");
    const r = await query(roomAmenitiesSql.listRoomAmenities, [rid]);
    return r.rows;
  }
}
