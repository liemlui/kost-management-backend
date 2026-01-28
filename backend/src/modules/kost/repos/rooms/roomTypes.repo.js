// modules/kost/repos/rooms/roomTypes.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");

/**
 * List all room types (admin view).
 * Returns rows[].
 */
async function listRoomTypes() {
  const result = await query(sql.rooms.listRoomTypes, [], {
    label: "kost.roomTypes.listRoomTypes",
  });
  return result.rows;
}

/**
 * Get single room type by id.
 * Returns row object or null.
 */
async function getRoomTypeById(id) {
  const result = await query(sql.rooms.getRoomTypeById, [id], {
    label: "kost.roomTypes.getRoomTypeById",
  });
  return result.rows[0] || null;
}

/**
 * Insert new room type.
 * Payload should match schema columns.
 * Returns inserted row (at least { id } depending on SQL RETURNING).
 */
async function insertRoomType(payload) {
  const {
    code,
    name,
    base_monthly_price,
    deposit_amount,
    is_capsule,
    room_width_m,
    room_length_m,
    bathroom_location,
    bathroom_width_m,
    bathroom_length_m,
    has_ac,
    has_fan,
    bed_type,
    bed_size_cm,
    is_active,
    notes,
  } = payload;

  const result = await query(
    sql.rooms.insertRoomType,
    [
      code,
      name,
      base_monthly_price ?? 0,
      deposit_amount ?? 0,
      !!is_capsule,
      room_width_m ?? null,
      room_length_m ?? null,
      bathroom_location,
      bathroom_width_m ?? null,
      bathroom_length_m ?? null,
      !!has_ac,
      !!has_fan,
      bed_type,
      bed_size_cm ?? null,
      !!is_active,
      notes || null,
    ],
    { label: "kost.roomTypes.insertRoomType" },
  );

  return result.rows[0];
}

/**
 * Update existing room type.
 * Returns updated row (or null).
 */
async function updateRoomType(id, payload) {
  const {
    code,
    name,
    base_monthly_price,
    deposit_amount,
    is_capsule,
    room_width_m,
    room_length_m,
    bathroom_location,
    bathroom_width_m,
    bathroom_length_m,
    has_ac,
    has_fan,
    bed_type,
    bed_size_cm,

    is_active,
    notes,
  } = payload;

  const result = await query(
    sql.rooms.updateRoomType,
    [
      id,
      code,
      name,
      base_monthly_price ?? 0,
      deposit_amount ?? 0,
      !!is_capsule,
      room_width_m ?? null,
      room_length_m ?? null,
      bathroom_location,
      bathroom_width_m ?? null,
      bathroom_length_m ?? null,
      !!has_ac,
      !!has_fan,
      bed_type,
      bed_size_cm ?? null,
      !!is_active,
      notes || null,
    ],
    { label: "kost.roomTypes.updateRoomType" },
  );

  return result.rows[0] || null;
}

/**
 * Toggle active state of room type.
 * Returns { id, is_active } if SQL returns it.
 */
async function toggleRoomTypeActive(id) {
  const result = await query(sql.rooms.toggleRoomTypeActive, [id], {
    label: "kost.roomTypes.toggleRoomTypeActive",
  });
  return result.rows[0] || null;
}

async function setRoomTypeActive(id, isActive) {
  const result = await query(sql.rooms.setRoomTypeActive, [id, isActive], {
    label: "kost.roomTypes.setRoomTypeActive",
  });
  return result.rows[0] || null;
}

async function deactivateRoomType(id) {
  const result = await query(sql.rooms.deactivateRoomType, [id], {
    label: "kost.roomTypes.deactivateRoomType",
  });
  return result.rows[0] || null;
}
async function countRoomsUsingRoomType(roomTypeId) {
  const result = await query(
    sql.rooms.countRoomsUsingRoomType,
    [roomTypeId],
    { label: "kost.roomTypes.countRoomsUsingRoomType" },
  );
  return result.rows[0]?.cnt ?? 0;
}
async function listRoomTypesWithRoomCount() {
  const result = await query(sql.rooms.listRoomTypesWithRoomCount, [], {
    label: "kost.roomTypes.listRoomTypesWithRoomCount",
  });
  return result.rows;
}

module.exports = {
  listRoomTypes,
  getRoomTypeById,
  insertRoomType,
  updateRoomType,
  toggleRoomTypeActive,
  setRoomTypeActive,
  deactivateRoomType,
  countRoomsUsingRoomType,
  listRoomTypesWithRoomCount,
};
