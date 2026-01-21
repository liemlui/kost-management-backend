module.exports = {

  /* =====================================================
   * ROOMS
   * ===================================================== */

  listRooms: `
    SELECT
      r.id,
      r.room_code,
      r.floor_no,
      r.status,
      rt.code AS room_type_code,
      rt.name AS room_type_name,
      rt.base_monthly_price
    FROM kost.rooms r
    JOIN kost.room_types rt ON rt.id = r.room_type_id
    ORDER BY r.room_code
  `,

  listRoomTypes: `
    SELECT
      id,
      code,
      name
    FROM kost.room_types
    ORDER BY code
  `,
getRoomById: `
  SELECT
    id,
    status
  FROM kost.rooms
  WHERE id = $1
`,



  insertRoom: `
    INSERT INTO kost.rooms
      (room_code, room_type_id, floor_no, status)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *
  `,
markRoomOccupied: `
  UPDATE kost.rooms
  SET status = 'OCCUPIED',
      updated_at = NOW()
  WHERE id = $1
    AND status = 'AVAILABLE'
  RETURNING *
`,


  /* =====================================================
   * TENANTS
   * ===================================================== */

  listTenants: `
    SELECT
      id,
      full_name,
      phone,
      email,
      id_number,
      emergency_contact_name,
      emergency_contact_phone,
      created_at
    FROM kost.tenants
    ORDER BY full_name
  `,

  insertTenant: `
    INSERT INTO kost.tenants
      (
        full_name,
        phone,
        email,
        id_number,
        emergency_contact_name,
        emergency_contact_phone,
        notes
      )
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,


  /* =====================================================
   * STAYS (OCCUPANCY)
   * ===================================================== */

  listStays: `
  SELECT
    s.id,
    s.check_in_at,
    s.planned_check_out_at,
    s.check_out_at,
    s.status,
    s.agreed_rent_amount,
    s.deposit_amount,
    t.full_name AS tenant_name,
    r.room_code
  FROM kost.stays s
  JOIN kost.tenants t ON t.id = s.tenant_id
  JOIN kost.rooms r ON r.id = s.room_id
  ORDER BY s.status DESC, s.check_in_at DESC, s.id DESC
`,


  listAvailableRooms: `
    SELECT
      r.id,
      r.room_code,
      rt.code AS room_type_code,
      rt.name AS room_type_name
    FROM kost.rooms r
    JOIN kost.room_types rt ON rt.id = r.room_type_id
    WHERE r.status = 'ACTIVE'
      AND NOT EXISTS (
        SELECT 1
        FROM kost.stays s
        WHERE s.room_id = r.id
          AND s.status = 'ACTIVE'
      )
    ORDER BY r.room_code
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
  RETURNING *
`,


  getStayById: `
  SELECT id, room_id, status, check_out_at
  FROM kost.stays
  WHERE id = $1
`,


  endStay: `
  UPDATE kost.stays
  SET status = 'ENDED',
      check_out_at = $2
  WHERE id = $1
    AND status = 'ACTIVE'
  RETURNING *
`,


    /* =====================================================
   * AUDIT
   * ===================================================== */

  insertAuditLog: `
    INSERT INTO kost.audit_log
      (actor_id, action, entity_type, entity_id, before_json, after_json)
    VALUES
      ($1, $2, $3, $4, $5, $6)
  `,
  /* =====================================================
   * ROOM BLOCKING
   * ===================================================== */

  blockRoom: `
    UPDATE kost.rooms
    SET status = 'MAINTENANCE',
        updated_at = NOW()
    WHERE id = $1
      AND status <> 'MAINTENANCE'
    RETURNING *
  `,

  unblockRoom: `
    UPDATE kost.rooms
    SET status = 'AVAILABLE',
        updated_at = NOW()
    WHERE id = $1
      AND status = 'MAINTENANCE'
    RETURNING *
  `,
  /* =====================================================
   * OVERDUE CHECKER
   * ===================================================== */

  listOverdueStaysHPlus7: `
    SELECT
      s.id AS stay_id,
      s.room_id,
      s.tenant_id,
      i.id AS invoice_id,
      i.due_date,
      (CURRENT_DATE - i.due_date) AS days_overdue
    FROM kost.invoices i
    JOIN kost.stays s ON s.id = i.stay_id
    WHERE i.status IN ('ISSUED', 'OVERDUE', 'UNDERPAID')
      AND i.due_date <= CURRENT_DATE - INTERVAL '7 days'
      AND s.status = 'ACTIVE'
    ORDER BY i.due_date ASC
  `,

};
