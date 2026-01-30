// src/modules/kost/repos/rooms/roomAmenity.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");
const { assertPositiveInt } = require("../../../../shared/ids");

async function listRoomAmenities(roomId) {
  const rid = assertPositiveInt(roomId, "kost.roomAmenities.listRoomAmenities");

  const result = await query(sql.rooms.listRoomAmenities, [rid], {
    label: "kost.roomAmenities.listRoomAmenities",
  });

  return result.rows;
}

async function listActiveAmenitiesNotInRoom(roomId) {
  const rid = assertPositiveInt(
    roomId,
    "kost.roomAmenities.listActiveAmenitiesNotInRoom"
  );

  const result = await query(sql.rooms.listActiveAmenitiesNotInRoom, [rid], {
    label: "kost.roomAmenities.listActiveAmenitiesNotInRoom",
  });

  return result.rows;
}

async function insertRoomAmenity(roomId, payload) {
  const rid = assertPositiveInt(roomId, "kost.roomAmenities.insertRoomAmenity");
  const aid = assertPositiveInt(
    payload.amenity_id,
    "kost.roomAmenities.insertRoomAmenity.amenity_id"
  );

  const qty = Number(payload.qty);
  const normalizedQty = Number.isFinite(qty) && qty > 0 ? qty : 1;

  const result = await query(
    sql.rooms.insertRoomAmenity,
    [
      rid,
      aid,
      normalizedQty,
      payload.condition || null,
      payload.notes || null,
    ],
    { label: "kost.roomAmenities.insertRoomAmenity" }
  );

  return result.rows[0];
}

async function updateRoomAmenity(roomId, roomAmenityId, payload) {
  const rid = assertPositiveInt(roomId, "kost.roomAmenities.updateRoomAmenity");
  const raid = assertPositiveInt(
    roomAmenityId,
    "kost.roomAmenities.updateRoomAmenity.roomAmenityId"
  );

  const qty = Number(payload.qty);
  const normalizedQty = Number.isFinite(qty) && qty > 0 ? qty : 1;

  const result = await query(
    sql.rooms.updateRoomAmenity,
    [
      raid,
      rid,
      normalizedQty,
      payload.condition || null,
      payload.notes || null,
    ],
    { label: "kost.roomAmenities.updateRoomAmenity" }
  );

  return result.rows[0] || null;
}

async function deleteRoomAmenity(roomId, roomAmenityId) {
  const rid = assertPositiveInt(roomId, "kost.roomAmenities.deleteRoomAmenity");
  const raid = assertPositiveInt(
    roomAmenityId,
    "kost.roomAmenities.deleteRoomAmenity.roomAmenityId"
  );

  const result = await query(sql.rooms.deleteRoomAmenity, [raid, rid], {
    label: "kost.roomAmenities.deleteRoomAmenity",
  });

  return result.rows[0] || null;
}

module.exports = {
  listRoomAmenities,
  listActiveAmenitiesNotInRoom,
  insertRoomAmenity,
  updateRoomAmenity,
  deleteRoomAmenity,
};
