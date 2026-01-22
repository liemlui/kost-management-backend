// modules/kost/repos/stays/stay.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");

function toIntId(id, label) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`Invalid id for ${label}: ${id}`);
    err.status = 400;
    throw err;
  }
  return n;
}

function toMoney(v, label) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) {
    const err = new Error(`Invalid amount for ${label}: ${v}`);
    err.status = 400;
    throw err;
  }
  // keep as number; pg will cast numeric
  return n;
}

function requireText(v, label) {
  if (v === undefined || v === null || String(v).trim() === "") {
    const err = new Error(`${label} is required`);
    err.status = 400;
    throw err;
  }
  return String(v).trim();
}

function toDateISO(v, label, { required = false } = {}) {
  if (v === undefined || v === null || v === "") {
    if (required) {
      const err = new Error(`${label} is required`);
      err.status = 400;
      throw err;
    }
    return null;
  }
  // expecting YYYY-MM-DD from <input type="date">
  const s = String(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const err = new Error(`Invalid date for ${label}: ${v}`);
    err.status = 400;
    throw err;
  }
  return s;
}

function calcAnchorDay(checkInAtISO) {
  // YYYY-MM-DD -> DD
  const day = Number(checkInAtISO.slice(8, 10));
  return Number.isInteger(day) ? day : null;
}

async function listStays({ status = null, q = null } = {}) {
  const s = status && status !== "ALL" ? String(status) : null;
  const keyword = q && String(q).trim() ? String(q).trim() : null;

  const result = await query(
    sql.stays.listStaysFiltered,
    [s, keyword],
    { label: "kost.stays.listStaysFiltered" }
  );
  return result.rows;
}

async function listAvailableRooms() {
  const result = await query(sql.stays.listAvailableRooms, [], { label: "kost.stays.listAvailableRooms" });
  return result.rows;
}

async function listActiveTenants() {
  const result = await query(sql.stays.listActiveTenants, [], { label: "kost.stays.listActiveTenants" });
  return result.rows;
}

async function createStay(payload) {
  const tenant_id = toIntId(payload.tenant_id, "kost.stays.insertStay.tenant_id");
  const room_id = toIntId(payload.room_id, "kost.stays.insertStay.room_id");

  const check_in_at = toDateISO(payload.check_in_at, "check_in_at", { required: true });
  const planned_check_out_at = toDateISO(payload.planned_check_out_at, "planned_check_out_at");

  const rent_period = requireText(payload.rent_period, "rent_period"); // DAILY/WEEKLY/BIWEEKLY/MONTHLY
  const agreed_rent_amount = toMoney(payload.agreed_rent_amount, "agreed_rent_amount");
  if (agreed_rent_amount === null) {
    const err = new Error("agreed_rent_amount is required");
    err.status = 400;
    throw err;
  }

  const deposit_amount = toMoney(payload.deposit_amount, "deposit_amount") ?? 0;

  // billing_anchor_day only for MONTHLY
  let billing_anchor_day = null;
  if (rent_period === "MONTHLY") {
    if (payload.billing_anchor_day !== undefined && payload.billing_anchor_day !== null && payload.billing_anchor_day !== "") {
      billing_anchor_day = Number(payload.billing_anchor_day);
      if (!Number.isInteger(billing_anchor_day) || billing_anchor_day < 1 || billing_anchor_day > 31) {
        const err = new Error(`Invalid billing_anchor_day: ${payload.billing_anchor_day}`);
        err.status = 400;
        throw err;
      }
    } else {
      billing_anchor_day = calcAnchorDay(check_in_at); // default from check-in day
    }
  }

  // electricity
  const electricity_mode = (payload.electricity_mode && String(payload.electricity_mode).trim()) || "METERED";
  const electricity_fixed_amount = toMoney(payload.electricity_fixed_amount, "electricity_fixed_amount") ?? 0;
  const water_fixed_amount = toMoney(payload.water_fixed_amount, "water_fixed_amount") ?? 0;
  const internet_fixed_amount = toMoney(payload.internet_fixed_amount, "internet_fixed_amount") ?? 0;

  const notes = payload.notes ? String(payload.notes) : null;
  const created_by = payload.created_by ? Number(payload.created_by) : null;

  const result = await query(
    sql.stays.insertStay,
    [
      tenant_id,
      room_id,
      "ACTIVE",
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
    ],
    { label: "kost.stays.insertStay" }
  );

  return result.rows?.[0]?.id;
}

async function getStayById(id) {
  const stayId = toIntId(id, "kost.stays.getStayById");
  const result = await query(sql.stays.getStayById, [stayId], { label: "kost.stays.getStayById" });
  return result.rows[0] || null;
}

async function endStay(id, checkOutDateISO) {
  const stayId = toIntId(id, "kost.stays.endStay");
  const result = await query(sql.stays.endStay, [stayId, checkOutDateISO], { label: "kost.stays.endStay" });
  return result.rows[0] || null;
}

async function getStaySnapshot(id) {
  const stayId = toIntId(id, "kost.stays.getStaySnapshot");
  const result = await query(sql.stays.getStaySnapshot, [stayId], { label: "kost.stays.getStaySnapshot" });
  return result.rows[0] || null;
}

module.exports = {
  listStays,
  listAvailableRooms,
  listActiveTenants,
  createStay,
  getStayById,
  endStay,
  getStaySnapshot,
};
