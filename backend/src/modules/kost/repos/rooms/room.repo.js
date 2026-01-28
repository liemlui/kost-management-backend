// modules/kost/repos/rooms/room.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql"); // <- sekarang registry punya namespace rooms/tenants/stays/...

async function q(statement, params, label) {
  return query(statement, params, { label: label || "kost.room.repo" });
}

function assertNumberId(id, label) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`Invalid id for ${label}: ${id}`);
    err.status = 400;
    throw err;
  }
  return n;
}

async function listRooms(roomTypeId = null) {
  const result = await query(sql.rooms.listRooms, [roomTypeId], {
    label: "kost.rooms.listRooms",
  });
  return result.rows;
}

async function listRoomTypes() {
  const { rows } = await q(
    sql.rooms.listRoomTypes,
    [],
    "kost.room_types.listRoomTypes",
  );
  return rows.filter((r) => r.is_active);
}

async function getRoomById(id) {
  const roomId = assertNumberId(id, "kost.rooms.getRoomById");
  const { rows } = await q(
    sql.rooms.getRoomById,
    [roomId],
    "kost.rooms.getRoomById",
  );
  return rows[0] || null;
}

async function insertRoom(payload) {
  const params = [
    payload.code,
    payload.room_type_id,
    payload.floor,
    payload.position_zone,
    payload.status,
    payload.notes,
  ];
  const { rows } = await q(
    sql.rooms.insertRoom,
    params,
    "kost.rooms.insertRoom",
  );
  return rows[0];
}

async function updateRoom({ id, ...payload }) {
  const roomId = assertNumberId(id, "kost.rooms.updateRoom");
  const params = [
    roomId,
    payload.code,
    payload.room_type_id,
    payload.floor,
    payload.position_zone,
    payload.status,
    payload.notes,
  ];
  const { rows } = await q(
    sql.rooms.updateRoom,
    params,
    "kost.rooms.updateRoom",
  );
  return rows[0] || null;
}

async function deleteRoom(id) {
  const roomId = assertNumberId(id, "kost.rooms.deleteRoom");
  const result = await q(
    sql.rooms.deleteRoom,
    [roomId],
    "kost.rooms.deleteRoom",
  );
  return { rowCount: result.rowCount };
}

async function blockRoom(id) {
  const roomId = assertNumberId(id, "kost.rooms.blockRoom");
  const { rows } = await q(
    sql.rooms.blockRoom,
    [roomId],
    "kost.rooms.blockRoom",
  );
  return rows[0];
}

async function unblockRoom(id) {
  const roomId = assertNumberId(id, "kost.rooms.unblockRoom");
  const { rows } = await q(
    sql.rooms.unblockRoom,
    [roomId],
    "kost.rooms.unblockRoom",
  );
  return rows[0];
}

function updateRoomType(roomId, roomTypeId) {
  const rid = assertNumberId(roomId, "kost.rooms.updateRoomType.roomId");
  const rtid = assertNumberId(
    roomTypeId,
    "kost.rooms.updateRoomType.roomTypeId",
  );
  return query(sql.rooms.updateRoomTypeForRoom, [rid, rtid], {
    label: "kost.rooms.updateRoomType",
  }).then((r) => r.rows[0] || null);
}

module.exports = {
  listRooms,
  listRoomTypes,
  getRoomById,
  insertRoom,
  updateRoom,
  deleteRoom,
  blockRoom,
  unblockRoom,
  updateRoomType,
};
