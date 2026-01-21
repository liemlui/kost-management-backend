const { query } = require('../../../db/pool');
const sql = require('../kost.sql');

async function listStays() {
  return query(
    sql.listStays,
    [],
    'kost.listStays'
  );
}

async function listAvailableRooms() {
  return query(
    sql.listAvailableRooms,
    [],
    'kost.listAvailableRooms'
  );
}



async function createStay(payload) {
  const {
    tenant_id,
    room_id,
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
    created_by,
  } = payload;
return query(
    sql.insertStay,
    [
      tenant_id,
      room_id,
      "ACTIVE",
      check_in_at,
      planned_check_out_at || null,
      rent_period || null,
      agreed_rent_amount || null,
      deposit_amount || null,
      billing_anchor_day || null,
      electricity_mode || null,
      electricity_fixed_amount || null,
      water_fixed_amount || null,
      internet_fixed_amount || null,
      notes || null,
      created_by || null,
    ],
    "kost.insertStay"
  );
}

async function getStayById(id) {
  return query(
    sql.getStayById,
    [id],
    'kost.getStayById'
  );
}

async function endStay(id, checkOutAt) {
  return query(sql.endStay, [id, checkOutAt], "kost.endStay");
}
async function getStaySnapshot(id) {
  return query(
    `SELECT * FROM kost.stays WHERE id = $1`,
    [id],
    "kost.getStaySnapshot"
  );
}


async function insertAuditLog({
  actor_id,
  action,
  entity_type,
  entity_id,
  before_json,
  after_json,
}) {
  return query(
    sql.insertAuditLog,
    [actor_id, action, entity_type, entity_id, before_json, after_json],
    'kost.insertAuditLog'
  );
}

module.exports = {
  listStays,
  listAvailableRooms,
  createStay,
  getStayById,
  endStay,
    getStaySnapshot,
    insertAuditLog,
};
