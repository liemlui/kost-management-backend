const { query } = require("../../../../db/pool");
const sql = require("../../sql");

function toBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  if (v === null || v === undefined) return false;

  // kalau body-parser mengirim array karena double field, ambil yang terakhir
  if (Array.isArray(v)) v = v[v.length - 1];

  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "on" || s === "yes";
}

function normalizePayload(body) {
  return {
    name: body.name?.trim(),
    location_type: (body.location_type || "").trim().toUpperCase(),
    room_id: parseRoomId(body.room_id),
    is_active: toBool(body.is_active),
  };
}

async function q(statement, params, label) {
  return query(statement, params, { label });
}


async function listLocations() {
  const { rows } = await q(
    sql.inventory.listLocations,
    [],
    "kost.inventory.locations.list"
  );
  return rows;
}

async function listActiveLocations() {
  const { rows } = await q(
    sql.inventory.listActiveLocations,
    [],
    "kost.inventory.locations.listActive"
  );
  return rows;
}

async function getById(id) {
  const { rows } = await q(
    sql.inventory.getLocationById,
    [id],
    "kost.inventory.locations.getById"
  );
  return rows[0] || null;
}

async function insertLocation(p) {
  const { rows } = await q(
    sql.inventory.insertLocation,
    [p.location_type, p.room_id, p.name, p.is_active],
    "kost.inventory.locations.insert"
  );
  return rows[0];
}

async function updateLocation(id, p) {
  await q(
    sql.inventory.updateLocation,
    [id, p.location_type, p.room_id, p.name, p.is_active],
    "kost.inventory.locations.update"
  );
}

async function softDelete(id) {
  await q(
    sql.inventory.softDeleteLocation,
    [id],
    "kost.inventory.locations.softDelete"
  );
}

module.exports = {
  listLocations,
  listActiveLocations,
  getById,
  insertLocation,
  updateLocation,
  softDelete,
};
