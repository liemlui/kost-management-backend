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
      // identity
      data.tenant_id,
      data.room_id,
      data.check_in_at,
      data.rent_period,
      data.room_variant,
      data.billing_anchor_day,
      data.planned_check_out_at,

      // pricing snapshot
      data.base_rent_amount,
      data.additional_rent_amount ?? 0,
      data.additional_rent_reason ?? null,

      data.discount_amount ?? 0,
      data.discount_reason ?? null,

      data.agreed_rent_amount,

      // fixed snapshots
      data.deposit_amount,
      data.electricity_mode,
      data.electricity_fixed_amount ?? 0,
      data.water_fixed_amount ?? 0,
      data.internet_fixed_amount ?? 0,

      // misc
      data.notes ?? null,
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
 * Snapshot stay (audit / before update)
 */
async function getStaySnapshot(stayId) {
  return query(
    sql.getStaySnapshot,
    [stayId],
    'kost.stays.getStaySnapshot'
  );
}

/**
 * Checkout
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

async function endStay(stayId, payload) {
  return query(
    sql.endStay,
    [stayId, payload.check_out_at],
    'kost.stays.endStay'
  );
}

async function markPhysicalCheckout(stayId, at) {
  return query(
    sql.markPhysicalCheckout,
    [stayId, at],
    "kost.stays.markPhysicalCheckout"
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
 * Pricing context helper
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

module.exports = {
  createStay,
  listStaysFiltered,
  countStaysFiltered,
  getStayById,
  getStaySnapshot,
  checkoutStay,
  endStay,
  markPhysicalCheckout,
  forceEndStay,
  listAvailableRooms,
  listActiveTenants,
  getRoomPricingContext,
};
