// modules/kost/repos/rooms/roomTypes.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");
const { assertId } = require("../_repoUtils");

async function listRoomTypes() {
  const result = await query(sql.rooms.listRoomTypes, [], {
    label: "kost.roomTypes.listRoomTypes",
  });
  return result.rows;
}

// SQL listRoomTypes kamu sudah include COUNT rooms_count,
// jadi ini alias yang aman (biar tidak ada ReferenceError).
async function listRoomTypesWithRoomCount() {
  return listRoomTypes();
}

async function listActiveRoomTypes() {
  const result = await query(sql.rooms.listActiveRoomTypes, [], {
    label: "kost.roomTypes.listActiveRoomTypes",
  });
  return result.rows;
}

async function getRoomTypeById(id) {
  const rid = assertId(id, "kost.roomTypes.getRoomTypeById");
  const result = await query(sql.rooms.getRoomTypeById, [rid], {
    label: "kost.roomTypes.getRoomTypeById",
  });
  return result.rows[0] || null;
}

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
    { label: "kost.roomTypes.insertRoomType" }
  );

  return result.rows[0];
}

async function updateRoomType(id, payload) {
  const rid = assertId(id, "kost.roomTypes.updateRoomType");
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
      rid,
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
    { label: "kost.roomTypes.updateRoomType" }
  );

  return result.rows[0] || null;
}

async function toggleRoomTypeActive(id) {
  const rid = assertId(id, "kost.roomTypes.toggleRoomTypeActive");
  const result = await query(sql.rooms.toggleRoomTypeActive, [rid], {
    label: "kost.roomTypes.toggleRoomTypeActive",
  });
  return result.rows[0] || null;
}

async function setRoomTypeActive(id, isActive) {
  const rid = assertId(id, "kost.roomTypes.setRoomTypeActive");
  const result = await query(sql.rooms.setRoomTypeActive, [rid, !!isActive], {
    label: "kost.roomTypes.setRoomTypeActive",
  });
  return result.rows[0] || null;
}

async function deactivateRoomType(id) {
  return setRoomTypeActive(id, false);
}

async function countRoomsUsingRoomType(roomTypeId) {
  const rid = assertId(roomTypeId, "kost.roomTypes.countRoomsUsingRoomType");
  const result = await query(sql.rooms.countRoomsUsingRoomType, [rid], {
    label: "kost.roomTypes.countRoomsUsingRoomType",
  });
  return result.rows[0]?.cnt ?? 0;
}

module.exports = {
  listRoomTypes,
  listRoomTypesWithRoomCount,
  listActiveRoomTypes,
  getRoomTypeById,
  insertRoomType,
  updateRoomType,
  toggleRoomTypeActive,
  setRoomTypeActive,
  deactivateRoomType,
  countRoomsUsingRoomType,
};
