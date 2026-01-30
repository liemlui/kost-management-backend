// modules/kost/repos/rooms/room.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql"); // registry SQL kost.*
const { assertId, assertNullableId } = require("../_repoUtils");

async function q(statement, params, label) {
  return query(statement, params, { label: label || "kost.rooms.repo" });
}

async function listRooms(roomTypeId = null) {
  const rtid = assertNullableId(roomTypeId, "kost.rooms.listRooms.roomTypeId");
  const { rows } = await q(sql.rooms.listRooms, [rtid], "kost.rooms.listRooms");
  return rows;
}

async function listRoomsForDropdown() {
  const { rows } = await q(
    sql.rooms.listRoomsForDropdown,
    [],
    "kost.rooms.listRoomsForDropdown"
  );
  return rows;
}

async function getRoomById(id) {
  const roomId = assertId(id, "kost.rooms.getRoomById");
  const { rows } = await q(sql.rooms.getRoomById, [roomId], "kost.rooms.getRoomById");
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
  const { rows } = await q(sql.rooms.insertRoom, params, "kost.rooms.insertRoom");
  return rows[0];
}

async function updateRoom({ id, ...payload }) {
  const roomId = assertId(id, "kost.rooms.updateRoom");
  const params = [
    roomId,
    payload.code,
    payload.room_type_id,
    payload.floor,
    payload.position_zone,
    payload.status,
    payload.notes,
  ];
  const { rows } = await q(sql.rooms.updateRoom, params, "kost.rooms.updateRoom");
  return rows[0] || null;
}

/**
 * Soft delete (INACTIVE).
 */
async function deleteRoom(id) {
  const roomId = assertId(id, "kost.rooms.deleteRoom");
  const statement = sql.rooms.setRoomInactive || sql.rooms.deleteRoom;
  const result = await q(statement, [roomId], "kost.rooms.deleteRoom");
  return { rowCount: result.rowCount };
}

async function blockRoom(id) {
  const roomId = assertId(id, "kost.rooms.blockRoom");
  const statement = sql.rooms.setRoomMaintenance || sql.rooms.blockRoom;
  const { rows } = await q(statement, [roomId], "kost.rooms.blockRoom");
  return rows[0] || null;
}

async function unblockRoom(id) {
  const roomId = assertId(id, "kost.rooms.unblockRoom");
  const statement = sql.rooms.setRoomAvailable || sql.rooms.unblockRoom;
  const { rows } = await q(statement, [roomId], "kost.rooms.unblockRoom");
  return rows[0] || null;
}

async function updateRoomType(roomId, roomTypeId) {
  const rid = assertId(roomId, "kost.rooms.updateRoomType.roomId");
  const rtid = assertId(roomTypeId, "kost.rooms.updateRoomType.roomTypeId");
  const statement = sql.rooms.setRoomType || sql.rooms.updateRoomTypeId;

  const { rows } = await q(statement, [rid, rtid], "kost.rooms.updateRoomType");
  return rows[0] || null;
}

module.exports = {
  listRooms,
  listRoomsForDropdown,
  getRoomById,
  insertRoom,
  updateRoom,
  deleteRoom,
  blockRoom,
  unblockRoom,
  updateRoomType,
};
