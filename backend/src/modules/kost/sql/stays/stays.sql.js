// modules/kost/sql/stays/stays.sql.js
module.exports = {
  listStays: `
    SELECT
      s.id,
      s.status,
      s.check_in_at,
      s.planned_check_out_at,
      s.check_out_at,
      s.physical_check_out_at,
      s.rent_period,
      s.agreed_rent_amount,
      s.deposit_amount,
      s.billing_anchor_day,
      s.electricity_mode,
      s.electricity_fixed_amount,
      s.water_fixed_amount,
      s.internet_fixed_amount,
      s.notes,

      t.id AS tenant_id,
      t.full_name AS tenant_name,

      r.id AS room_id,
      r.code AS room_code
    FROM kost.stays s
    JOIN kost.tenants t ON t.id = s.tenant_id
    JOIN kost.rooms r ON r.id = s.room_id
    ORDER BY
      CASE s.status
        WHEN 'ACTIVE' THEN 1
        WHEN 'FORCED_ENDED' THEN 2
        WHEN 'ENDED' THEN 3
        WHEN 'CANCELLED' THEN 4
        ELSE 9
      END,
      s.check_in_at DESC,
      s.id DESC;
  `,

  listAvailableRooms: `
    SELECT
      r.id,
      r.code AS room_code,
      rt.code AS room_type_code,
      rt.name AS room_type_name
    FROM kost.rooms r
    JOIN kost.room_types rt ON rt.id = r.room_type_id
    WHERE r.status = 'AVAILABLE'
      AND NOT EXISTS (
        SELECT 1
        FROM kost.stays s
        WHERE s.room_id = r.id
          AND s.status = 'ACTIVE'
      )
    ORDER BY r.code;
  `,

  listActiveTenants: `
    SELECT
      t.id,
      t.full_name
    FROM kost.tenants t
    WHERE t.is_active = TRUE
    ORDER BY t.full_name;
  `,

  insertStay: `
    INSERT INTO kost.stays
      (
        tenant_id,
        room_id,
        status,
        check_in_at,
        planned_check_out_at,
        rent_period,
        agreed_rent_amount,
        deposit_amount,
        billing_anchor_day,
        electricity_mode,
        electricity_fixed_amount,
        water_fixed_amount,
        internet_fixed_amount,
        notes,
        created_by
      )
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING id;
  `,

  getStayById: `
    SELECT
      s.id,
      s.status,
      s.check_in_at,
      s.planned_check_out_at,
      s.check_out_at,
      s.physical_check_out_at,
      s.rent_period,
      s.agreed_rent_amount,
      s.deposit_amount,
      s.billing_anchor_day,
      s.electricity_mode,
      s.electricity_fixed_amount,
      s.water_fixed_amount,
      s.internet_fixed_amount,
      s.notes,
      s.created_at,

      t.id AS tenant_id,
      t.full_name AS tenant_name,

      r.id AS room_id,
      r.code AS room_code,
      rt.code AS room_type_code,
      rt.name AS room_type_name
    FROM kost.stays s
    JOIN kost.tenants t ON t.id = s.tenant_id
    JOIN kost.rooms r ON r.id = s.room_id
    JOIN kost.room_types rt ON rt.id = r.room_type_id
    WHERE s.id = $1;
  `,

  getStaySnapshot: `
    SELECT *
    FROM kost.stays
    WHERE id = $1;
  `,

  endStay: `
    UPDATE kost.stays
    SET status = 'ENDED',
        check_out_at = $2
    WHERE id = $1
      AND status = 'ACTIVE'
    RETURNING id, status, check_out_at;
  `,
  // modules/kost/sql/stays/stays.sql.js
listStaysFiltered: `
  SELECT
    s.id,
    s.status,
    s.check_in_at,
    s.planned_check_out_at,
    s.check_out_at,
    s.rent_period,
    s.agreed_rent_amount,
    s.deposit_amount,
    t.full_name AS tenant_name,
    r.code AS room_code
  FROM kost.stays s
  JOIN kost.tenants t ON t.id = s.tenant_id
  JOIN kost.rooms r ON r.id = s.room_id
  WHERE
    ($1::text IS NULL OR s.status = $1::text)
    AND (
      $2::text IS NULL
      OR t.full_name ILIKE ('%' || $2::text || '%')
      OR r.code ILIKE ('%' || $2::text || '%')
    )
  ORDER BY
    (s.status = 'ACTIVE') DESC,
    s.check_in_at DESC,
    s.id DESC;
`,

};
