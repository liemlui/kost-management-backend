// modules/kost/repos/rooms/roomAmenity.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");

/**
 * List amenities attached to a room.
 * Returns rows[].
 */
async function listRoomAmenities(roomId) {
  const result = await query(
    sql.rooms.listRoomAmenities,
    [roomId],
    { label: "kost.roomAmenities.listRoomAmenities" }
  );
  return result.rows;
}

/**
 * List active amenities that are NOT yet attached to a room.
 * Useful for "Add amenity to room" UI.
 * Returns rows[].
 */
async function listActiveAmenitiesNotInRoom(roomId) {
  const result = await query(
    sql.rooms.listActiveAmenitiesNotInRoom,
    [roomId],
    { label: "kost.roomAmenities.listActiveAmenitiesNotInRoom" }
  );
  return result.rows;
}

/**
 * Attach an amenity to a room (create mapping).
 * Returns inserted row (at least { id } depending on SQL RETURNING).
 */
async function insertRoomAmenity(roomId, payload) {
  const { amenity_id, qty, condition, notes } = payload;

  const result = await query(
    sql.rooms.insertRoomAmenity,
    [
      roomId,
      amenity_id,
      Number.isFinite(Number(qty)) ? Number(qty) : 1,
      condition || null,
      notes || null,
    ],
    { label: "kost.roomAmenities.insertRoomAmenity" }
  );

  return result.rows[0];
}

/**
 * Update a room amenity mapping row.
 * Returns updated row (or null).
 */
async function updateRoomAmenity(roomId, roomAmenityId, payload) {
  const { qty, condition, notes } = payload;

  const result = await query(
    sql.rooms.updateRoomAmenity,
    [
      roomAmenityId,
      roomId,
      Number.isFinite(Number(qty)) ? Number(qty) : 1,
      condition || null,
      notes || null,
    ],
    { label: "kost.roomAmenities.updateRoomAmenity" }
  );

  return result.rows[0] || null;
}

/**
 * Delete a room amenity mapping row.
 * Returns deleted row (or null) depending on SQL RETURNING.
 */
async function deleteRoomAmenity(roomId, roomAmenityId) {
  const result = await query(
    sql.rooms.deleteRoomAmenity,
    [roomAmenityId, roomId],
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
