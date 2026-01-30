// src/modules/kost/sql/rooms/rooms.sql.js

const LIST_ROOMS = `
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
    rt.base_monthly_price,

    (s.id IS NOT NULL) AS is_occupied,
    s.tenant_id AS active_tenant_id,
    s.check_in_at AS active_check_in_at

  FROM kost.rooms r
  JOIN kost.room_types rt ON rt.id = r.room_type_id
  LEFT JOIN kost.stays s
    ON s.room_id = r.id
   AND s.status = 'ACTIVE'
  WHERE ($1::bigint IS NULL OR r.room_type_id = $1::bigint)
  ORDER BY r.floor, r.code;
`;

const LIST_ROOMS_FOR_DROPDOWN = `
  SELECT id, code
  FROM kost.rooms
  ORDER BY floor, code;
`;

const GET_ROOM_BY_ID = `
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
`;

const INSERT_ROOM = `
  INSERT INTO kost.rooms
    (code, room_type_id, floor, position_zone, status, notes)
  VALUES
    ($1, $2, $3, $4, $5, $6)
  RETURNING id;
`;

const UPDATE_ROOM = `
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
`;

const SET_ROOM_TYPE = `
  UPDATE kost.rooms
  SET room_type_id = $2, updated_at = now()
  WHERE id = $1
  RETURNING id, room_type_id;
`;

const SOFT_DELETE_ROOM = `
  UPDATE kost.rooms
  SET status = 'INACTIVE', updated_at = now()
  WHERE id = $1
  RETURNING id;
`;

const SET_ROOM_MAINTENANCE = `
  UPDATE kost.rooms
  SET status = 'MAINTENANCE', updated_at = now()
  WHERE id = $1
  RETURNING id;
`;

const SET_ROOM_AVAILABLE = `
  UPDATE kost.rooms
  SET status = 'AVAILABLE', updated_at = now()
  WHERE id = $1
  RETURNING id;
`;

module.exports = {
  // canonical
  listRooms: LIST_ROOMS,
  listRoomsForDropdown: LIST_ROOMS_FOR_DROPDOWN,
  getRoomById: GET_ROOM_BY_ID,
  insertRoom: INSERT_ROOM,
  updateRoom: UPDATE_ROOM,
  setRoomType: SET_ROOM_TYPE,
  setRoomInactive: SOFT_DELETE_ROOM,
  setRoomMaintenance: SET_ROOM_MAINTENANCE,
  setRoomAvailable: SET_ROOM_AVAILABLE,

  // backward-compat aliases (tanpa duplikasi teks query)
  updateRoomTypeId: SET_ROOM_TYPE,
  deleteRoom: SOFT_DELETE_ROOM,
  blockRoom: SET_ROOM_MAINTENANCE,
  unblockRoom: SET_ROOM_AVAILABLE,
};
