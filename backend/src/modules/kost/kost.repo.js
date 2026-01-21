const { query } = require("../../db/pool");
const sql = require("./kost.sql");

async function getRooms() {
  return query(sql.listRooms, [], "kost.listRooms");
}

async function getRoomTypes() {
  return query(sql.listRoomTypes, [], "kost.listRoomTypes");
}

async function createRoom({ room_code, room_type_id, floor_no, status }) {
  return query(
    sql.insertRoom,
    [room_code, room_type_id, floor_no, status],
    "kost.insertRoom"
  );
}

async function getTenants() {
  return query(sql.listTenants, [], "kost.listTenants");
}

async function createTenant(payload) {
  const {
    full_name,
    phone,
    email,
    id_number,
    emergency_contact_name,
    emergency_contact_phone,
    notes,
  } = payload;

  return query(
    sql.insertTenant,
    [
      full_name,
      phone || null,
      email || null,
      id_number || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      notes || null,
    ],
    "kost.insertTenant"
  );
}
async function getStays() {
  return query(sql.listStays, [], "kost.listStays");
}

async function getAvailableRooms() {
  return query(sql.listAvailableRooms, [], "kost.listAvailableRooms");
}

async function createStay(payload) {
  const {
    tenant_id,
    room_id,
    start_date,
    end_date,
    monthly_price_override,
    deposit_override,
  } = payload;

  return query(
    sql.insertStay,
    [
      tenant_id,
      room_id,
      start_date,
      end_date || null,
      "ACTIVE",
      monthly_price_override || null,
      deposit_override || null,
    ],
    "kost.insertStay"
  );
}
async function getStayById(id) {
  return query(sql.getStayById, [id], "kost.getStayById");
}

async function endStay(id, end_date) {
  return query(sql.endStay, [id, end_date], "kost.endStay");
}

module.exports = {
  getRooms,
  getRoomTypes,
  createRoom,
    getTenants,
    createTenant,
    getStays,
    getAvailableRooms,
    createStay,
    getStayById,
    endStay,
};
