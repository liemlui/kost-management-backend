import type { QueryResult } from "pg";
import { query } from "../../../db/pool";
import { roomsSql } from "./rooms.sql";

function assertId(v: unknown, label: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`Invalid id at ${label}`);
  return n;
}

function assertNullableId(v: unknown, label: string): number | null {
  if (v === null || v === undefined || v === "") return null;
  return assertId(v, label);
}

export type RoomInsertPayload = {
  code: string;
  room_type_id: number;
  floor: number;
  position_zone: string | null;
  status: "AVAILABLE" | "MAINTENANCE" | "INACTIVE";
  notes: string | null;
};

export class RoomsRepo {
  async listRooms(roomTypeId: number | null): Promise<any[]> {
    const rtid = assertNullableId(roomTypeId, "kost.rooms.listRooms.roomTypeId");
    const r = await query(roomsSql.listRooms, [rtid]);
    return r.rows;
  }

  async getRoomById(id: number): Promise<any | null> {
    const rid = assertId(id, "kost.rooms.getRoomById");
    const r = await query(roomsSql.getRoomById, [rid]);
    return r.rows[0] ?? null;
  }

  async insertRoom(p: RoomInsertPayload): Promise<{ id: number } | null> {
    const params = [p.code, p.room_type_id, p.floor, p.position_zone, p.status, p.notes];
    const r: QueryResult<{ id: number }> = await query(roomsSql.insertRoom, params);
    return r.rows[0] ?? null;
  }

  async updateRoom(id: number, p: RoomInsertPayload): Promise<{ id: number } | null> {
    const rid = assertId(id, "kost.rooms.updateRoom");
    const params = [rid, p.code, p.room_type_id, p.floor, p.position_zone, p.status, p.notes];
    const r: QueryResult<{ id: number }> = await query(roomsSql.updateRoom, params);
    return r.rows[0] ?? null;
  }

  async setInactive(id: number): Promise<void> {
    const rid = assertId(id, "kost.rooms.setInactive");
    await query(roomsSql.setRoomInactive, [rid]);
  }

  async setMaintenance(id: number): Promise<void> {
    const rid = assertId(id, "kost.rooms.setMaintenance");
    await query(roomsSql.setRoomMaintenance, [rid]);
  }

  async setAvailable(id: number): Promise<void> {
    const rid = assertId(id, "kost.rooms.setAvailable");
    await query(roomsSql.setRoomAvailable, [rid]);
  }

  async updateRoomType(roomId: number, roomTypeId: number): Promise<void> {
    const rid = assertId(roomId, "kost.rooms.updateRoomType.roomId");
    const rtid = assertId(roomTypeId, "kost.rooms.updateRoomType.roomTypeId");
    await query(roomsSql.setRoomType, [rid, rtid]);
  }
}
