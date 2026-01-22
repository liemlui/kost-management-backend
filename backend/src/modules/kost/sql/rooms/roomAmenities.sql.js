// modules/kost/sql/rooms/roomAmenities.sql.js
module.exports = {
  listRoomAmenities: `
    SELECT
      ra.id,
      ra.room_id,
      ra.amenity_id,
      a.code AS amenity_code,
      a.name AS amenity_name,
      a.category,
      a.unit_label,
      ra.qty,
      ra.condition,
      ra.notes
    FROM kost.room_amenities ra
    JOIN kost.amenities a ON a.id = ra.amenity_id
    WHERE ra.room_id = $1
    ORDER BY a.category, a.name;
  `,
  listActiveAmenitiesNotInRoom: `
    SELECT a.id, a.code, a.name, a.category, a.unit_label
    FROM kost.amenities a
    WHERE a.is_active = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM kost.room_amenities ra
        WHERE ra.room_id = $1
          AND ra.amenity_id = a.id
      )
    ORDER BY a.category, a.name;
  `,
  insertRoomAmenity: `
    INSERT INTO kost.room_amenities (room_id, amenity_id, qty, condition, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `,
  updateRoomAmenity: `
    UPDATE kost.room_amenities
    SET qty = $3,
        condition = $4,
        notes = $5
    WHERE id = $1
      AND room_id = $2
    RETURNING id;
  `,
  deleteRoomAmenity: `
    DELETE FROM kost.room_amenities
    WHERE id = $1
      AND room_id = $2
    RETURNING id;
  `,
};
