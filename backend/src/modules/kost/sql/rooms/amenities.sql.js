// src/modules/kost/sql/rooms/amenities.sql.js

const LIST_AMENITIES = `
  SELECT id, code, name, category, unit_label, is_active
  FROM kost.amenities
  ORDER BY category, name;
`;

const GET_AMENITY_BY_ID = `
  SELECT id, code, name, category, unit_label, is_active
  FROM kost.amenities
  WHERE id = $1;
`;

const INSERT_AMENITY = `
  INSERT INTO kost.amenities (code, name, category, unit_label, is_active)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id;
`;

const UPDATE_AMENITY = `
  UPDATE kost.amenities
  SET
    code = $2,
    name = $3,
    category = $4,
    unit_label = $5,
    is_active = $6
  WHERE id = $1
  RETURNING id;
`;

const TOGGLE_AMENITY_ACTIVE = `
  UPDATE kost.amenities
  SET is_active = NOT is_active
  WHERE id = $1
  RETURNING id, is_active;
`;

const SET_AMENITY_ACTIVE = `
  UPDATE kost.amenities
  SET is_active = $2
  WHERE id = $1
  RETURNING id, is_active;
`;

module.exports = {
  listAmenities: LIST_AMENITIES,
  getAmenityById: GET_AMENITY_BY_ID,
  insertAmenity: INSERT_AMENITY,
  updateAmenity: UPDATE_AMENITY,
  toggleAmenityActive: TOGGLE_AMENITY_ACTIVE,
  setAmenityActive: SET_AMENITY_ACTIVE,
};
