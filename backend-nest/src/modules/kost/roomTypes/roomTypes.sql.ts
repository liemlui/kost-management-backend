export const roomTypesSql = {
  listRoomTypes: `
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
  `,
  listActiveRoomTypes: `
    SELECT id, code, name
    FROM kost.room_types
    WHERE is_active = TRUE
    ORDER BY code ASC;
  `,
} as const;
