// src/modules/kost/repos/rooms/amenity.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");
const { assertPositiveInt } = require("../../../../shared/ids");

async function listAmenities() {
  const result = await query(sql.rooms.listAmenities, [], {
    label: "kost.amenities.listAmenities",
  });
  return result.rows;
}

async function getAmenityById(id) {
  const aid = assertPositiveInt(id, "kost.amenities.getAmenityById");
  const result = await query(sql.rooms.getAmenityById, [aid], {
    label: "kost.amenities.getAmenityById",
  });
  return result.rows[0] || null;
}

async function insertAmenity(payload) {
  const { code, name, category, unit_label, is_active } = payload;

  const result = await query(
    sql.rooms.insertAmenity,
    [code, name, category, unit_label || null, !!is_active],
    { label: "kost.amenities.insertAmenity" }
  );

  return result.rows[0];
}

async function updateAmenity(id, payload) {
  const aid = assertPositiveInt(id, "kost.amenities.updateAmenity");
  const { code, name, category, unit_label, is_active } = payload;

  const result = await query(
    sql.rooms.updateAmenity,
    [aid, code, name, category, unit_label || null, !!is_active],
    { label: "kost.amenities.updateAmenity" }
  );

  return result.rows[0] || null;
}

async function toggleAmenityActive(id) {
  const aid = assertPositiveInt(id, "kost.amenities.toggleAmenityActive");
  const result = await query(sql.rooms.toggleAmenityActive, [aid], {
    label: "kost.amenities.toggleAmenityActive",
  });

  return result.rows[0];
}

module.exports = {
  listAmenities,
  getAmenityById,
  insertAmenity,
  updateAmenity,
  toggleAmenityActive,
};
