// modules/kost/sql/rooms/roomTypes.sql.js
module.exports = {
  listRoomTypes: `
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
  updateRoomTypeForRoom: `
  UPDATE kost.rooms
  SET room_type_id = $2,
      updated_at = now()
  WHERE id = $1
  RETURNING id, room_type_id;
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

  // Optional: "delete" versi aman = deactivate
  deactivateRoomType: `
  UPDATE kost.room_types
  SET is_active = false
  WHERE id = $1
  RETURNING id, is_active;
`,
};
