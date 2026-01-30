// src/modules/kost/sql/rooms/roomTypes.sql.js

const ROOM_TYPES_WITH_COUNT = `
  SELECT
    rt.id, rt.code, rt.name,
    rt.base_monthly_price, rt.deposit_amount,
    rt.is_capsule,
    rt.room_width_m, rt.room_length_m,
    rt.bathroom_location, rt.bathroom_width_m, rt.bathroom_length_m,
    rt.has_ac, rt.has_fan,
    rt.bed_type, rt.bed_size_cm,
    rt.is_active,
    rt.notes,
    rt.created_at,
    rt.updated_at,
    COUNT(r.id)::int AS rooms_count
  FROM kost.room_types rt
  LEFT JOIN kost.rooms r
    ON r.room_type_id = rt.id
  GROUP BY rt.id
  ORDER BY rt.code ASC;
`;

module.exports = {
  listRoomTypes: ROOM_TYPES_WITH_COUNT,
  listRoomTypesWithRoomCount: ROOM_TYPES_WITH_COUNT,

  listActiveRoomTypes: `
    SELECT id, code, name
    FROM kost.room_types
    WHERE is_active = TRUE
    ORDER BY code ASC;
  `,

  getRoomTypeById: `
    SELECT
      id, code, name,
      base_monthly_price, deposit_amount,
      is_capsule,
      room_width_m, room_length_m,
      bathroom_location, bathroom_width_m, bathroom_length_m,
      has_ac, has_fan,
      bed_type, bed_size_cm,
      is_active,
      notes,
      created_at,
      updated_at
    FROM kost.room_types
    WHERE id = $1;
  `,

  insertRoomType: `
    INSERT INTO kost.room_types
    (
      code, name,
      base_monthly_price, deposit_amount,
      is_capsule,
      room_width_m, room_length_m,
      bathroom_location, bathroom_width_m, bathroom_length_m,
      has_ac, has_fan,
      bed_type, bed_size_cm,
      is_active,
      notes
    )
    VALUES
    (
      $1,$2,
      $3,$4,
      $5,
      $6,$7,
      $8,$9,$10,
      $11,$12,
      $13,$14,
      $15,
      $16
    )
    RETURNING id;
  `,

  updateRoomType: `
    UPDATE kost.room_types
    SET
      code = $2,
      name = $3,
      base_monthly_price = $4,
      deposit_amount = $5,
      is_capsule = $6,
      room_width_m = $7,
      room_length_m = $8,
      bathroom_location = $9,
      bathroom_width_m = $10,
      bathroom_length_m = $11,
      has_ac = $12,
      has_fan = $13,
      bed_type = $14,
      bed_size_cm = $15,
      is_active = $16,
      notes = $17
    WHERE id = $1
    RETURNING id;
  `,

  toggleRoomTypeActive: `
    UPDATE kost.room_types
    SET is_active = NOT is_active
    WHERE id = $1
    RETURNING id, is_active;
  `,

  setRoomTypeActive: `
    UPDATE kost.room_types
    SET is_active = $2
    WHERE id = $1
    RETURNING id, is_active;
  `,

  countRoomsUsingRoomType: `
    SELECT COUNT(*)::int AS cnt
    FROM kost.rooms
    WHERE room_type_id = $1;
  `,
};
