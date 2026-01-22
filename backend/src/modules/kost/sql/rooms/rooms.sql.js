// modules/kost/sql/rooms/rooms.sql.js
module.exports = {
  listRooms: `
    SELECT
      r.id,
      r.code,
      r.floor,
      r.position_zone,
      r.status,
      r.notes,
      r.created_at,
      r.updated_at,
      rt.id AS room_type_id,
      rt.code AS room_type_code,
      rt.name AS room_type_name,
      rt.base_monthly_price
    FROM kost.rooms r
    JOIN kost.room_types rt ON rt.id = r.room_type_id
    ORDER BY r.floor, r.code;
  `,

  listRoomTypes: `
    SELECT id, code, name, base_monthly_price, is_active
    FROM kost.room_types
    ORDER BY code;
  `,

  getRoomById: `
    SELECT
      r.id,
      r.code,
      r.room_type_id,
      r.floor,
      r.position_zone,
      r.status,
      r.notes,
      r.created_at,
      r.updated_at,

      rt.code AS room_type_code,
      rt.name AS room_type_name,
      rt.base_monthly_price,
      rt.deposit_amount,

      rt.room_width_m,
      rt.room_length_m,

      rt.has_ac,
      rt.has_fan,

      rt.bathroom_location,
      rt.bathroom_width_m,
      rt.bathroom_length_m,

      rt.is_capsule,
      rt.bed_type,
      rt.bed_size_cm,

      rt.is_active AS room_type_is_active,
      rt.notes AS room_type_notes

    FROM kost.rooms r
    JOIN kost.room_types rt ON rt.id = r.room_type_id
    WHERE r.id = $1;
  `,

  insertRoom: `
    INSERT INTO kost.rooms
      (code, room_type_id, floor, position_zone, status, notes)
    VALUES
      ($1, $2, $3, $4, $5, $6)
    RETURNING id;
  `,

  updateRoom: `
    UPDATE kost.rooms
    SET
      code = $2,
      room_type_id = $3,
      floor = $4,
      position_zone = $5,
      status = $6,
      notes = $7,
      updated_at = now()
    WHERE id = $1
    RETURNING id;
  `,
  updateRoomTypeForRoom : `
  UPDATE kost.rooms
  SET room_type_id = $2,
      updated_at = now()
  WHERE id = $1
  RETURNING id, room_type_id
`,

  deleteRoom: `
    DELETE FROM kost.rooms
    WHERE id = $1;
  `,

  blockRoom: `
    UPDATE kost.rooms
    SET status = 'MAINTENANCE', updated_at = now()
    WHERE id = $1
    RETURNING id;
  `,

  unblockRoom: `
    UPDATE kost.rooms
    SET status = 'AVAILABLE', updated_at = now()
    WHERE id = $1
    RETURNING id;
  `,
};
