/**
 * Stay Repository
 * ----------------
 * Tanggung jawab:
 * - Akses langsung ke database (kost.stays)
 * - Tidak ada business logic
 * - Tidak ada validasi UI
 */

const { query } = require('../../../../db/pool');
const sql = require('../../sql/stays/stays.sql');

/**
 * Create new stay
 */
async function createStay(data) {
  return query(
    sql.createStay,
    [
      data.tenant_id,
      data.room_id,
      data.check_in_at,
      data.rent_period,
      data.billing_anchor_day,
      data.planned_check_out_at,

      data.base_rent_amount,
      data.additional_rent_amount ?? 0,
      data.discount_amount ?? 0,
      data.agreed_rent_amount,

      data.deposit_amount,
      data.electricity_mode,
      data.notes,
      data.created_by,
    ],
    "kost.stays.createStay"
  );
}


/**
 * List stays with optional filters
 */
async function listStaysFiltered(filters = {}) {
   const limit = Number.isFinite(Number(filters.limit)) ? Number(filters.limit) : 50;
  const offset = Number.isFinite(Number(filters.offset)) ? Number(filters.offset) : 0;
  const params = [
    filters.status ?? null,
    filters.tenant_id ?? null,
    filters.room_id ?? null,
    filters.date_from ?? null,
    filters.date_to ?? null,
    limit,
    offset,
  ];

  return query(
    sql.listStaysFiltered,
    params,
    'kost.stays.listStaysFiltered'
  );
}


/**
 * Get single stay (detail page)
 */
async function getStayById(stayId) {
  return query(
    sql.getStayById,
    [stayId],
    'kost.stays.getStayById'
  );
}

/**
 * Snapshot stay (for audit / before update)
 */
async function getStaySnapshot(stayId) {
  return query(
    sql.getStaySnapshot,
    [stayId],
    'kost.stays.getStaySnapshot'
  );
}

/**
 * Normal checkout (admin action)
 */
async function checkoutStay(stayId, payload) {
  return query(
    sql.checkoutStay,
    [
      stayId,
      payload.check_out_at,
      payload.physical_check_out_at,
    ],
    'kost.stays.checkoutStay'
  );
}

/**
 * Simple end stay (tanpa physical checkout)
 * optional helper
 */
async function endStay(stayId, payload) {
  return query(
    sql.endStay,
    [
      stayId,
      payload.check_out_at,
    ],
    'kost.stays.endStay'
  );
}

/**
 * Dropdown helpers
 */
async function listAvailableRooms() {
  return query(
    sql.listAvailableRooms,
    [],
    'kost.stays.listAvailableRooms'
  );
}

async function listActiveTenants() {
  return query(
    sql.listActiveTenants,
    [],
    'kost.stays.listActiveTenants'
  );
}

/**
 * Pricing context helper (autofill form)
 */
async function getRoomPricingContext(roomId) {
  return query(
    sql.getRoomPricingContext,
    [roomId],
    'kost.stays.getRoomPricingContext'
  );
}

async function forceEndStay(stayId, payload) {
  return query(
    sql.forceEndStay,
    [stayId, payload.check_out_at],
    "kost.stays.forceEndStay"
  );
}
async function countStaysFiltered(filters = {}) {
  const params = [
    filters.status ?? null,
    filters.tenant_id ?? null,
    filters.room_id ?? null,
    filters.date_from ?? null,
    filters.date_to ?? null,
  ];

  return query(
    sql.countStaysFiltered,
    params,
    "kost.stays.countStaysFiltered"
  );
}

module.exports = {
  createStay,
  listStaysFiltered,
  countStaysFiltered,
  getStayById,
  getStaySnapshot,
  checkoutStay,
  endStay,
  forceEndStay,
  listAvailableRooms,
  listActiveTenants,
  getRoomPricingContext,
};
