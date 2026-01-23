// modules/kost/services/stays/stay.service.js
const stayRepo = require("../../repos/stays/stay.repo");
const roomRepo = require("../../repos/rooms/room.repo");

// ---------------- helpers ----------------
function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function clampMin0(n) {
  return n < 0 ? 0 : n;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * planned_check_out_at auto:
 * DAILY    => +1 day
 * WEEKLY   => +7 days
 * BIWEEKLY => +14 days
 * MONTHLY  => +1 month
 */
function computePlannedCheckout(checkInISO, rentPeriod) {
  const checkIn = new Date(checkInISO + "T00:00:00+07:00");
  switch (rentPeriod) {
    case "DAILY":
      return addDays(checkIn, 1);
    case "WEEKLY":
      return addDays(checkIn, 7);
    case "BIWEEKLY":
      return addDays(checkIn, 14);
    case "MONTHLY":
    default:
      return addMonths(checkIn, 1);
  }
}

/**
 * Contract amount rule (fleksibel):
 * base_rent_amount = room_type.base_monthly_price (snapshot)
 * agreed_rent_amount = base_rent_amount + additional_rent_amount - discount_amount
 *
 * NOTE:
 * - additional & discount disediakan admin di kontrak awal
 * - backend recompute ulang agar tidak bisa dimanipulasi client
 */
async function computeContractAmounts({ room_id, rent_period, check_in_at, additional_rent_amount, discount_amount, deposit_amount }) {
  const ctxRes = await stayRepo.getRoomPricingContext(room_id);
  if (!ctxRes || ctxRes.rowCount === 0) {
    throw new Error("Room pricing context not found");
  }

  const ctx = ctxRes.rows[0];

  const base = clampMin0(toNumber(ctx.base_monthly_price, 0));
  const additional = clampMin0(toNumber(additional_rent_amount, 0));
  const discount = clampMin0(toNumber(discount_amount, 0));

  const agreed = clampMin0(base + additional - discount);



  // default deposit jika tidak diisi
  const depositFinal =
    deposit_amount === null || deposit_amount === undefined
      ? clampMin0(toNumber(ctx.deposit_amount, 0))
      : clampMin0(toNumber(deposit_amount, 0));

  const planned = computePlannedCheckout(check_in_at, rent_period || "MONTHLY");

  return {
    base_rent_amount: base,
    additional_rent_amount: additional,
    discount_amount: discount,
    agreed_rent_amount: agreed,
    deposit_amount: depositFinal,
    planned_check_out_at: planned,
  };
}

// ---------------- main services ----------------
async function createStay(payload) {
  const { tenant_id, room_id, check_in_at } = payload;

  if (!tenant_id || !room_id || !check_in_at) {
    throw new Error("tenant_id, room_id, and check_in_at are required");
  }

  const rent_period = payload.rent_period || "MONTHLY";

  const computed = await computeContractAmounts({
    room_id,
    rent_period,
    check_in_at,
    additional_rent_amount: payload.additional_rent_amount,
    discount_amount: payload.discount_amount,
    deposit_amount: payload.deposit_amount,
  });

  const finalPayload = {
    ...payload,

    rent_period,

    // server-side truth
    base_rent_amount: computed.base_rent_amount,
    additional_rent_amount: computed.additional_rent_amount,
    discount_amount: computed.discount_amount,
    agreed_rent_amount: computed.agreed_rent_amount,

    deposit_amount: computed.deposit_amount,
    planned_check_out_at: computed.planned_check_out_at,

    // safe defaults for legacy fields
    electricity_mode: payload.electricity_mode || "METERED",
    electricity_fixed_amount: clampMin0(toNumber(payload.electricity_fixed_amount, 0)),
    water_fixed_amount: clampMin0(toNumber(payload.water_fixed_amount, 0)),
    internet_fixed_amount: clampMin0(toNumber(payload.internet_fixed_amount, 0)),
  };

  try {
    const result = await stayRepo.createStay(finalPayload);
    return result.rows[0];
  } catch (err) {
    if (err && err.code === "23505") {
      throw new Error("Room is already occupied (ACTIVE stay exists)");
    }
    throw err;
  }
}

/**
 * Preferred action name: Checkout
 * - status => ENDED
 * - set check_out_at + physical_check_out_at
 */
async function checkoutStay(stayId) {
  if (!stayId) throw new Error("Stay ID is required");

  const beforeRes = await stayRepo.getStaySnapshot(stayId);
  if (!beforeRes || beforeRes.rowCount === 0) throw new Error("Stay not found");

  const before = beforeRes.rows[0];
  if (before.status !== "ACTIVE") {
    throw new Error("Only ACTIVE stay can be checked out");
  }

  const now = new Date();

  const endRes = await stayRepo.checkoutStay(stayId, {
    check_out_at: now,
    physical_check_out_at: now,
  });

  if (!endRes || endRes.rowCount === 0) {
    throw new Error("Active stay not found or already ended");
  }

  // best-effort unblock room
  try {
    if (typeof roomRepo.unblockRoom === "function") {
      await roomRepo.unblockRoom(before.room_id);
    }
  } catch (_) {}

  return endRes.rows[0];
}

/**
 * Backward-compatible alias (kalau masih ada route /end)
 * akan mengarah ke checkoutStay
 */
async function endStay(stayId) {
  return checkoutStay(stayId);
}

async function forcedCheckout({ stay_id, actor_id, reason }) {
  if (!stay_id || !actor_id || !reason) {
    throw new Error("stay_id, actor_id, and reason are required");
  }

  const beforeRes = await stayRepo.getStaySnapshot(stay_id);
  if (!beforeRes || beforeRes.rowCount === 0) throw new Error("Stay not found");

  const before = beforeRes.rows[0];
  if (before.status !== "ACTIVE") {
    throw new Error("Only ACTIVE stay can be forced checkout");
  }

  // ✅ forced end stay => status FORCED_ENDED
  const endRes = await stayRepo.forceEndStay(stay_id, { check_out_at: new Date() });
  if (!endRes || endRes.rowCount === 0) throw new Error("Failed to force end stay");
  const stay = endRes.rows[0];

  // block room
  const blockRes = await roomRepo.blockRoom(before.room_id);

  let room;
  if (blockRes && blockRes.rowCount > 0) {
    room = blockRes.rows[0];
  } else {
    const roomRes = await roomRepo.getRoomById(before.room_id);
    if (!roomRes || roomRes.rowCount === 0) throw new Error("Room not found");
    room = roomRes.rows[0];
  }

  return { stay, room };
}

module.exports = {
  createStay,
  checkoutStay,
  endStay,
  forcedCheckout,
};
