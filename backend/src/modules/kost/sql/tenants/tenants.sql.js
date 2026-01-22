// modules/kost/sql/tenants/tenants.sql.js
module.exports = {
  // Search & filter:
  // - q: cari di full_name / phone / email / id_number
  // - is_active: "", "true", "false"
  listTenants: `
    SELECT
      id,
      full_name,
      phone,
      email,
      id_number,
      emergency_contact_name,
      emergency_contact_phone,
      is_active,
      created_at,
      updated_at
    FROM kost.tenants
    WHERE
      (
        COALESCE($1, '') = ''
        OR full_name ILIKE '%' || $1 || '%'
        OR phone ILIKE '%' || $1 || '%'
        OR email ILIKE '%' || $1 || '%'
        OR id_number ILIKE '%' || $1 || '%'
      )
      AND (
        COALESCE($2, '') = ''
        OR is_active = ($2::boolean)
      )
    ORDER BY full_name;
  `,

  getTenantById: `
    SELECT
      id,
      full_name,
      phone,
      email,
      id_number,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      home_address,
      origin_city,
      date_of_birth,
      gender,
      occupation,
      organization_name,
      stay_purpose,
      lead_source,
      is_active,
      notes,
      created_at,
      updated_at,
      created_by,
      updated_by
    FROM kost.tenants
    WHERE id = $1;
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
        notes,
        created_by,
        updated_by
      )
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id;
  `,

  updateTenant: `
    UPDATE kost.tenants
    SET
      full_name = $2,
      phone = $3,
      email = $4,
      id_number = $5,
      emergency_contact_name = $6,
      emergency_contact_phone = $7,
      notes = $8,
      updated_by = $9,
      updated_at = now()
    WHERE id = $1
    RETURNING id;
  `,

  toggleTenantActive: `
    UPDATE kost.tenants
    SET
      is_active = NOT is_active,
      updated_at = now()
    WHERE id = $1
    RETURNING id, is_active;
  `,
};
