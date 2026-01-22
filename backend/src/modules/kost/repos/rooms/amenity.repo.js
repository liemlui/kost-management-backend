// modules/kost/repos/rooms/amenity.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");

/**
 * List all amenities (admin view).
 * Returns rows[].
 */
async function listAmenities() {
  const result = await query(
    sql.rooms.listAmenities,
    [],
    { label: "kost.amenities.listAmenities" }
  );
  return result.rows;
}

/**
 * Get single amenity by id.
 * Returns row object or null.
 */
async function getAmenityById(id) {
  const result = await query(
    sql.rooms.getAmenityById,
    [id],
    { label: "kost.amenities.getAmenityById" }
  );
  return result.rows[0] || null;
}

/**
 * Insert new amenity.
 * Returns inserted row (at least { id } depending on SQL RETURNING).
 */
async function insertAmenity(payload) {
  const { code, name, category, unit_label, is_active } = payload;

  const result = await query(
    sql.rooms.insertAmenity,
    [code, name, category, unit_label || null, !!is_active],
    { label: "kost.amenities.insertAmenity" }
  );

  return result.rows[0];
}

/**
 * Update amenity.
 * Returns updated row (at least { id } depending on SQL RETURNING).
 */
async function updateAmenity(id, payload) {
  const { code, name, category, unit_label, is_active } = payload;

  const result = await query(
    sql.rooms.updateAmenity,
    [id, code, name, category, unit_label || null, !!is_active],
    { label: "kost.amenities.updateAmenity" }
  );

  return result.rows[0] || null;
}

/**
 * Toggle active state.
 * Returns { id, is_active } if SQL returns it.
 */
async function toggleAmenityActive(id) {
  const result = await query(
    sql.rooms.toggleAmenityActive,
    [id],
    { label: "kost.amenities.toggleAmenityActive" }
  );

  return result.rows[0];
}

module.exports = {
  listAmenities,
  getAmenityById,
  insertAmenity,
  updateAmenity,
  toggleAmenityActive,
};
