// modules/kost/sql/rooms/amenities.sql.js
module.exports = {
  listAmenities: `
    SELECT id, code, name, category, unit_label, is_active
    FROM kost.amenities
    ORDER BY category, name;
  `,
  getAmenityById: `
    SELECT id, code, name, category, unit_label, is_active
    FROM kost.amenities
    WHERE id = $1;
  `,
  insertAmenity: `
    INSERT INTO kost.amenities (code, name, category, unit_label, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `,
  updateAmenity: `
    UPDATE kost.amenities
    SET code = $2,
        name = $3,
        category = $4,
        unit_label = $5,
        is_active = $6
    WHERE id = $1
    RETURNING id;
  `,
  toggleAmenityActive: `
    UPDATE kost.amenities
    SET is_active = NOT is_active
    WHERE id = $1
    RETURNING id, is_active;
  `,
};
