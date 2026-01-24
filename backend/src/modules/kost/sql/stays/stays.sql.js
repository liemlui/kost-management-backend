module.exports = {
  createStay: `
    INSERT INTO kost.stays (
      tenant_id,
      room_id,
      check_in_at,
      rent_period,
      room_variant,
      billing_anchor_day,
      planned_check_out_at,

      base_rent_amount,
      additional_rent_amount,
      additional_rent_reason,

      discount_amount,
      discount_reason,

      agreed_rent_amount,

      deposit_amount,
      electricity_mode,
      electricity_fixed_amount,
      water_fixed_amount,
      internet_fixed_amount,

      notes,
      status,
      created_by
    ) VALUES (
      $1,  $2,  $3,  $4,  $5,  $6,  $7,
      $8,  $9,  $10,
      $11, $12,
      $13,
      $14, $15, $16, $17, $18,
      $19,
      'ACTIVE',
      $20
    )
    RETURNING id;
  `,

  markPhysicalCheckout: `
    UPDATE kost.stays
    SET physical_check_out_at = $2
    WHERE id = $1
      AND physical_check_out_at IS NULL
    RETURNING id, physical_check_out_at;
  `,

  listStaysFiltered: `
    SELECT
      s.id,
      s.status,
      s.check_in_at,
      s.planned_check_out_at,
      s.check_out_at,
      s.physical_check_out_at,
      s.rent_period,
      s.room_variant,

      -- pricing snapshot
      s.base_rent_amount,
      s.additional_rent_amount,
      s.discount_amount,
      s.agreed_rent_amount,

      s.additional_rent_reason,
      s.discount_reason,

      -- fixed snapshots
      s.deposit_amount,
      s.billing_anchor_day,
      s.electricity_mode,
      s.electricity_fixed_amount,
      s.water_fixed_amount,
      s.internet_fixed_amount,

      s.notes,
      s.created_at,

      -- tenant
      t.id AS tenant_id,
      t.full_name AS tenant_name,

      -- room
      r.id AS room_id,
      r.code AS room_code,
      r.position_zone,

      -- room type (display only)
      rt.id AS room_type_id,
      rt.code AS room_type_code,
      rt.name AS room_type_name,
      rt.base_monthly_price
    FROM kost.stays s
    JOIN kost.tenants t ON t.id = s.tenant_id
    JOIN kost.rooms r ON r.id = s.room_id
    JOIN kost.room_types rt ON rt.id = r.room_type_id
    WHERE 1=1
      AND ($1::text   IS NULL OR s.status = $1)
      AND ($2::bigint IS NULL OR s.tenant_id = $2)
      AND ($3::bigint IS NULL OR s.room_id = $3)
      AND ($4::date   IS NULL OR s.check_in_at >= $4::date)
      AND ($5::date   IS NULL OR s.check_in_at <  $5::date)
    ORDER BY s.check_in_at DESC, s.id DESC
    LIMIT $6 OFFSET $7;
  `,

  countStaysFiltered: `
    SELECT COUNT(*)::bigint AS total
    FROM kost.stays s
    WHERE 1=1
      AND ($1::text   IS NULL OR s.status = $1)
      AND ($2::bigint IS NULL OR s.tenant_id = $2)
      AND ($3::bigint IS NULL OR s.room_id = $3)
      AND ($4::date   IS NULL OR s.check_in_at >= $4::date)
      AND ($5::date   IS NULL OR s.check_in_at <  $5::date);
  `,

  getStayById: `
    SELECT
      s.*,
      t.full_name AS tenant_name,
      r.code AS room_code,
      r.position_zone,
      rt.code AS room_type_code,
      rt.name AS room_type_name,
      rt.base_monthly_price
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

  checkoutStay: `
    UPDATE kost.stays
    SET
      status = 'ENDED',
      check_out_at = $2,
      physical_check_out_at = $3
    WHERE id = $1
      AND status = 'ACTIVE'
    RETURNING id;
  `,

  endStay: `
    UPDATE kost.stays
    SET
      status = 'ENDED',
      check_out_at = $2
    WHERE id = $1
      AND status = 'ACTIVE'
    RETURNING id, status, check_out_at;
  `,

  listAvailableRooms: `
    SELECT
      r.id,
      r.code AS room_code,
      r.position_zone,
      rt.code AS room_type_code,
      rt.name AS room_type_name,
      rt.base_monthly_price,
      rt.deposit_amount
    FROM kost.rooms r
    JOIN kost.room_types rt ON rt.id = r.room_type_id
    LEFT JOIN kost.stays s
      ON s.room_id = r.id AND s.status = 'ACTIVE'
    WHERE r.status = 'AVAILABLE'
      AND s.id IS NULL
    ORDER BY r.code ASC;
  `,

  listActiveTenants: `
    SELECT id, full_name
    FROM kost.tenants
    WHERE is_active = true
    ORDER BY full_name ASC;
  `,

  getRoomPricingContext: `
    SELECT
      r.id AS room_id,
      r.position_zone,
      rt.id AS room_type_id,
      rt.base_monthly_price,
      rt.deposit_amount,
      rt.has_ac,
      rt.has_fan
    FROM kost.rooms r
    JOIN kost.room_types rt ON rt.id = r.room_type_id
    WHERE r.id = $1;
  `,

  forceEndStay: `
    UPDATE kost.stays
    SET
      status = 'FORCED_ENDED',
      check_out_at = $2
    WHERE id = $1
      AND status = 'ACTIVE'
    RETURNING id, status, check_out_at, room_id, tenant_id;
  `,
};
