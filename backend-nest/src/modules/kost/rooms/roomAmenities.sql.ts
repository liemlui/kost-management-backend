export const roomAmenitiesSql = {
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
} as const;
