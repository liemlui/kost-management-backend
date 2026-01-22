// modules/kost/repos/tenants/tenant.repo.js

const { query } = require("../../../../db/pool");
const sql = require("../../sql");

async function listTenants({ q = "", is_active = "" } = {}) {
  return query(
    sql.tenants.listTenants,
    [q, is_active],
    "kost.tenants.listTenants"
  );
}

async function insertTenant(payload) {
  const params = [
    payload.full_name,
    payload.phone,
    payload.email,
    payload.id_number,
    payload.emergency_contact_name,
    payload.emergency_contact_phone,
    payload.notes,
    null, // created_by (auth belum ada)
    null, // updated_by (auth belum ada)
  ];

  return query(sql.tenants.insertTenant, params, "kost.tenants.insertTenant");
}

async function getTenantById(id) {
  return query(sql.tenants.getTenantById, [id], "kost.tenants.getTenantById");
}

async function updateTenant(id, payload) {
  const params = [
    id,
    payload.full_name,
    payload.phone,
    payload.email,
    payload.id_number,
    payload.emergency_contact_name,
    payload.emergency_contact_phone,
    payload.notes,
    null, // updated_by (auth belum ada)
  ];

  return query(sql.tenants.updateTenant, params, "kost.tenants.updateTenant");
}

async function toggleTenantActive(id) {
  return query(
    sql.tenants.toggleTenantActive,
    [id],
    "kost.tenants.toggleTenantActive"
  );
}

module.exports = {
  listTenants,
  insertTenant,
  getTenantById,
  updateTenant,
  toggleTenantActive,
};
