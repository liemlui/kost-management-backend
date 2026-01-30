// src/modules/kost/repos/rooms/room.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");
const { assertPositiveInt } = require("../../../../shared/ids");

async function q(statement, params, label) {
  return query(statement, params, { label: label || "kost.room.repo" });
}

async function listRooms(roomTypeId = null) {
  const { rows } = await q(
    sql.rooms.listRooms,
    [roomTypeId],
    "kost.rooms.listRooms"
  );
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
  const roomId = assertPositiveInt(id, "kost.rooms.getRoomById");
  const { rows } = await q(
    sql.rooms.getRoomById,
    [roomId],
    "kost.rooms.getRoomById"
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
  const { rows } = await q(sql.rooms.insertRoom, params, "kost.rooms.insertRoom");
  return rows[0];
}

async function updateRoom({ id, ...payload }) {
  const roomId = assertPositiveInt(id, "kost.rooms.updateRoom");
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

async function deleteRoom(id) {
  const roomId = assertPositiveInt(id, "kost.rooms.deleteRoom");
  const result = await q(sql.rooms.deleteRoom, [roomId], "kost.rooms.deleteRoom");
  return { rowCount: result.rowCount };
}

async function blockRoom(id) {
  const roomId = assertPositiveInt(id, "kost.rooms.blockRoom");
  const { rows } = await q(sql.rooms.blockRoom, [roomId], "kost.rooms.blockRoom");
  return rows[0] || null;
}

async function unblockRoom(id) {
  const roomId = assertPositiveInt(id, "kost.rooms.unblockRoom");
  const { rows } = await q(sql.rooms.unblockRoom, [roomId], "kost.rooms.unblockRoom");
  return rows[0] || null;
}

async function updateRoomType(roomId, roomTypeId) {
  const rid = assertPositiveInt(roomId, "kost.rooms.updateRoomType.roomId");
  const rtid = assertPositiveInt(roomTypeId, "kost.rooms.updateRoomType.roomTypeId");

  const { rows } = await q(
    sql.rooms.updateRoomTypeId,
    [rid, rtid],
    "kost.rooms.updateRoomType"
  );

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
