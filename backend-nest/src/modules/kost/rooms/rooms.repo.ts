import { query } from "../../../db/pool";
import { roomsSql } from "./rooms.sql";

export type RoomStatus = "AVAILABLE" | "MAINTENANCE" | "INACTIVE";

export type RoomPayload = {
  code: string;
  room_type_id: number;
  floor: 1 | 2;
  position_zone: "FRONT" | "MIDDLE" | "BACK" | null;
  status: RoomStatus;
  notes: string | null;
};

function assertId(v: unknown, label: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw Object.assign(new Error(`Invalid id: ${label}`), { status: 400 });
  return n;
}

export class RoomsRepo {
  async listRooms(roomTypeId: number | null) {
    const r = await query(roomsSql.listRooms, [roomTypeId]);
    return r.rows;
  }

  async getRoomById(id: number) {
    const rid = assertId(id, "kost.rooms.getRoomById");
    const r = await query(roomsSql.getRoomById, [rid]);
    return r.rows[0] ?? null;
  }

  async insertRoom(p: RoomPayload) {
    const r = await query<{ id: number }>(roomsSql.insertRoom, [
      p.code, p.room_type_id, p.floor, p.position_zone, p.status, p.notes,
    ]);
    return r.rows[0] ?? null;
  }

  async updateRoom(id: number, p: RoomPayload) {
    const rid = assertId(id, "kost.rooms.updateRoom");
    const r = await query<{ id: number }>(roomsSql.updateRoom, [
      rid, p.code, p.room_type_id, p.floor, p.position_zone, p.status, p.notes,
    ]);
    return r.rows[0] ?? null;
  }

  async setInactive(id: number) {
    const rid = assertId(id, "kost.rooms.setInactive");
    await query(roomsSql.setRoomInactive, [rid]);
  }

  async setMaintenance(id: number) {
    const rid = assertId(id, "kost.rooms.setMaintenance");
    await query(roomsSql.setRoomMaintenance, [rid]);
  }

  async setAvailable(id: number) {
    const rid = assertId(id, "kost.rooms.setAvailable");
    await query(roomsSql.setRoomAvailable, [rid]);
  }

  async updateRoomType(roomId: number, roomTypeId: number) {
    const rid = assertId(roomId, "kost.rooms.updateRoomType.roomId");
    const rtid = assertId(roomTypeId, "kost.rooms.updateRoomType.roomTypeId");
    await query(roomsSql.setRoomType, [rid, rtid]);
  }
}
