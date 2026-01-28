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
      ra.notes,
      ra.source,
      ra.is_active
    FROM kost.room_amenities ra
    JOIN kost.amenities a ON a.id = ra.amenity_id
    WHERE ra.room_id = $1
      AND ra.is_active = TRUE
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
          AND ra.is_active = TRUE
      )
    ORDER BY a.category, a.name;
  `,

  insertRoomAmenity: `
    INSERT INTO kost.room_amenities (room_id, amenity_id, qty, condition, notes, source, is_active)
    VALUES ($1, $2, $3, $4, $5, 'MANUAL', TRUE)
    ON CONFLICT (room_id, amenity_id)
    DO UPDATE SET
      qty = EXCLUDED.qty,
      condition = EXCLUDED.condition,
      notes = EXCLUDED.notes,
      source = 'MANUAL',
      is_active = TRUE
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

  // soft delete
  deleteRoomAmenity: `
    UPDATE kost.room_amenities
    SET is_active = FALSE
    WHERE id = $1
      AND room_id = $2
    RETURNING id;
  `,
};
