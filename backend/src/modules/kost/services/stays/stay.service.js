// modules/kost/services/stays/stay.service.js
const stayRepo = require("../../repos/stays/stay.repo");
const roomRepo = require("../../repos/rooms/room.repo");

// ---------------- constants ----------------
const DEFAULT_TARIFF = 2500;
const DEFAULT_WATER = 5000;

// ---------------- helpers ----------------
function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function clampMin0(n) {
  return n < 0 ? 0 : n;
}
function str(v) {
  return String(v ?? "").trim();
}

function computeBillingAnchorDay(checkInISO, explicitAnchorDay) {
  // kalau admin isi, pakai itu
  const given = Number(explicitAnchorDay);
  if (Number.isFinite(given) && given >= 1 && given <= 31) return given;

  // default: ikut tanggal check-in (WIB)
  const checkIn = new Date(checkInISO + "T00:00:00+07:00");
  return checkIn.getDate(); // 1..31
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
 * Rumus base rent (server-side truth), harus sama dengan preview:
 * MONTHLY:
 *  - FAN: monthly_price
 *  - AC:  monthly_price + (tariff * 120)
 * DAILY (listrik include): (monthly_price / 30) * 4
 * WEEKLY (listrik include):
 *  - FAN: (monthly_price / 4) + (tariff * 40)
 *  - AC:  (monthly_price / 4) + (tariff * 60)
 * BIWEEKLY (listrik include):
 *  - FAN: (monthly_price / 2) + (tariff * 60)
 *  - AC:  (monthly_price / 2) + (tariff * 100)
 */
function computeBase({ rent_period, monthly_price, tariff_per_kwh, room_variant }) {
  const p = rent_period;
  const m = toNumber(monthly_price, 0);
  const t = clampMin0(toNumber(tariff_per_kwh, 0));
  const v = (room_variant || "FAN").toUpperCase();

  if (p === "MONTHLY") {
    return v === "AC" ? (m + t * 120) : m;
  }
  if (p === "DAILY") {
    return (m / 30) * 4;
  }
  if (p === "WEEKLY") {
    return (m / 4) + t * (v === "AC" ? 60 : 40);
  }
  if (p === "BIWEEKLY") {
    return (m / 2) + t * (v === "AC" ? 100 : 60);
  }
  return m;
}

/**
 * Hitung & kunci snapshot kontrak di backend (anti-manipulasi client).
 */
async function computeContractAmounts({
  room_id,
  rent_period,
  check_in_at,
  room_variant,
  electricity_fixed_amount,
  additional_rent_amount,
  discount_amount,
  deposit_amount,
}) {
  const ctxRes = await stayRepo.getRoomPricingContext(room_id);
  if (!ctxRes || ctxRes.rowCount === 0) throw new Error("Room pricing context not found");
  const ctx = ctxRes.rows[0];

  const period = rent_period || "MONTHLY";
  const variant = (room_variant || "FAN").toUpperCase();

  // Snapshot tariff: jika kosong/null/undefined => pakai default
  const tariffRaw = electricity_fixed_amount;
  const tariff = (tariffRaw === null || tariffRaw === undefined || str(tariffRaw) === "")
    ? DEFAULT_TARIFF
    : clampMin0(toNumber(tariffRaw, 0));

  // Rule validasi: AC wajib punya tariff (minimal > 0)
  if (variant === "AC" && tariff <= 0) {
    throw new Error("Tariff per kWh is required for AC variant");
  }

  const base = clampMin0(
    computeBase({
      rent_period: period,
      monthly_price: ctx.base_monthly_price,
      tariff_per_kwh: tariff,
      room_variant: variant,
    })
  );

  const additional = clampMin0(toNumber(additional_rent_amount, 0));
  const discount = clampMin0(toNumber(discount_amount, 0));
  const agreed = clampMin0(base + additional - discount);

  const depositFinal =
    deposit_amount === null || deposit_amount === undefined || str(deposit_amount) === ""
      ? clampMin0(toNumber(ctx.deposit_amount, 0))
      : clampMin0(toNumber(deposit_amount, 0));

  const planned = computePlannedCheckout(check_in_at, period);

  return {
    base_rent_amount: base,
    additional_rent_amount: additional,
    discount_amount: discount,
    agreed_rent_amount: agreed,
    deposit_amount: depositFinal,
    planned_check_out_at: planned,
    tariff_snapshot: tariff,
  };
}

// ---------------- main services ----------------
async function createStay(payload) {
  const { tenant_id, room_id, check_in_at } = payload;

  if (!tenant_id || !room_id || !check_in_at) {
    throw new Error("tenant_id, room_id, and check_in_at are required");
  }

  // normalize rent_period (UI uses TWO_WEEKS; DB + service logic uses BIWEEKLY)
  let rent_period = payload.rent_period || "MONTHLY";
  if (rent_period === "TWO_WEEKS") rent_period = "BIWEEKLY";

let billing_anchor_day = null;

// billing_anchor_day hanya relevan untuk MONTHLY
if (rent_period === "MONTHLY") {
  billing_anchor_day = computeBillingAnchorDay(check_in_at, payload.billing_anchor_day);
}

  const room_variant = (payload.room_variant || "FAN").toUpperCase();

  const computed = await computeContractAmounts({
    room_id,
    rent_period,
    check_in_at,
    room_variant,
    electricity_fixed_amount: payload.electricity_fixed_amount,
    additional_rent_amount: payload.additional_rent_amount,
    discount_amount: payload.discount_amount,
    deposit_amount: payload.deposit_amount,
  });

  // electricity_mode derived (server-side truth)
  const electricity_mode = (rent_period === "MONTHLY") ? "METERED" : "INCLUDED";

  // snapshot water / internet default fallback (sesuai UI)
  const water_raw = payload.water_fixed_amount;
  const water_fixed_amount = (water_raw === null || water_raw === undefined || str(water_raw) === "")
    ? DEFAULT_WATER
    : clampMin0(toNumber(water_raw, 0));

  const internet_fixed_amount = clampMin0(toNumber(payload.internet_fixed_amount, 0));

  const finalPayload = {
    ...payload,

    rent_period,
    billing_anchor_day,

    // lock snapshot identity fields
    room_variant,
    electricity_mode,

    // reasons only when amount > 0
    discount_reason: computed.discount_amount > 0 ? (payload.discount_reason || "").trim() : null,
    additional_rent_reason: computed.additional_rent_amount > 0 ? (payload.additional_rent_reason || "").trim() : null,

    // server-side truth for contract snapshot
    base_rent_amount: computed.base_rent_amount,
    additional_rent_amount: computed.additional_rent_amount,
    discount_amount: computed.discount_amount,
    agreed_rent_amount: computed.agreed_rent_amount,

    deposit_amount: computed.deposit_amount,
    planned_check_out_at: computed.planned_check_out_at,

    // snapshot fixed amounts (tariff uses computed fallback)
    electricity_fixed_amount: computed.tariff_snapshot,
    water_fixed_amount,
    internet_fixed_amount,
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
    physical_check_out_at: null,
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

async function markPhysicalCheckout(stayId) {
  if (!stayId) throw new Error("Stay ID is required");
  const res = await stayRepo.markPhysicalCheckout(stayId, new Date());
  if (!res || res.rowCount === 0) throw new Error("Stay not found or already marked");
  return res.rows[0];
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
  markPhysicalCheckout,
  forcedCheckout,
};
