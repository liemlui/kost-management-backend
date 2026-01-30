// modules/kost/repos/rooms/roomAmenity.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");
const { assertId } = require("../_repoUtils");

async function listRoomAmenities(roomId) {
  const rid = assertId(roomId, "kost.roomAmenities.listRoomAmenities");
  const result = await query(
    sql.rooms.listRoomAmenities,
    [rid],
    { label: "kost.roomAmenities.listRoomAmenities" }
  );
  return result.rows;
}

async function listActiveAmenitiesNotInRoom(roomId) {
  const rid = assertId(roomId, "kost.roomAmenities.listActiveAmenitiesNotInRoom");
  const result = await query(
    sql.rooms.listActiveAmenitiesNotInRoom,
    [rid],
    { label: "kost.roomAmenities.listActiveAmenitiesNotInRoom" }
  );
  return result.rows;
}

async function insertRoomAmenity(roomId, payload) {
  const rid = assertId(roomId, "kost.roomAmenities.insertRoomAmenity.roomId");
  const { amenity_id, qty, condition, notes } = payload;
  const amenityId = assertId(amenity_id, "kost.roomAmenities.insertRoomAmenity.amenity_id");

  const result = await query(
    sql.rooms.insertRoomAmenity,
    [
      rid,
      amenityId,
      Number.isFinite(Number(qty)) ? Number(qty) : 1,
      condition || null,
      notes || null,
    ],
    { label: "kost.roomAmenities.insertRoomAmenity" }
  );

  return result.rows[0];
}

async function updateRoomAmenity(roomId, roomAmenityId, payload) {
  const rid = assertId(roomId, "kost.roomAmenities.updateRoomAmenity.roomId");
  const raid = assertId(roomAmenityId, "kost.roomAmenities.updateRoomAmenity.roomAmenityId");
  const { qty, condition, notes } = payload;

  const result = await query(
    sql.rooms.updateRoomAmenity,
    [
      raid,
      rid,
      Number.isFinite(Number(qty)) ? Number(qty) : 1,
      condition || null,
      notes || null,
    ],
    { label: "kost.roomAmenities.updateRoomAmenity" }
  );

  return result.rows[0] || null;
}

async function deleteRoomAmenity(roomId, roomAmenityId) {
  const rid = assertId(roomId, "kost.roomAmenities.deleteRoomAmenity.roomId");
  const raid = assertId(roomAmenityId, "kost.roomAmenities.deleteRoomAmenity.roomAmenityId");

  const result = await query(
    sql.rooms.deleteRoomAmenity,
    [raid, rid],
    { label: "kost.roomAmenities.deleteRoomAmenity" }
  );

  return result.rows[0] || null;
}

module.exports = {
  listRoomAmenities,
  listActiveAmenitiesNotInRoom,
  insertRoomAmenity,
  updateRoomAmenity,
  deleteRoomAmenity,
};
