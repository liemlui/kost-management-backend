// modules/kost/controllers/stays/stays.controller.js
const stayRepo = require("../../repos/stays/stay.repo");
const { get } = require("../../routes");
const stayService = require("../../services/stays/stay.service");

// ---------- helpers ----------
function pickForm(body = {}) {
  return {
    tenant_id: body.tenant_id || "",
    room_id: body.room_id || "",
    check_in_at: body.check_in_at || "",
    rent_period: body.rent_period || "MONTHLY",

    additional_rent_amount: body.additional_rent_amount || "",
    additional_rent_reason: body.additional_rent_reason || "",

    discount_amount: body.discount_amount || "",
    discount_reason: body.discount_reason || "",

    deposit_amount: body.deposit_amount || "",
    billing_anchor_day: body.billing_anchor_day || "",
    electricity_mode: body.electricity_mode || "METERED",
    electricity_fixed_amount: body.electricity_fixed_amount || "",
    water_fixed_amount: body.water_fixed_amount || "",
    internet_fixed_amount: body.internet_fixed_amount || "",

    notes: body.notes || "",
  };
}
function getTodayISO_WIB() {
  const now = new Date();
  const wibNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const yyyy = wibNow.getFullYear();
  const mm = String(wibNow.getMonth() + 1).padStart(2, "0");
  const dd = String(wibNow.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function toNullIfEmpty(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
function toIntOrNull(v) {
  const x = toNullIfEmpty(v);
  if (x === null) return null;
  const n = Number.parseInt(x, 10);
  return Number.isFinite(n) ? n : null;
}
function toNumOrNull(v) {
  const x = toNullIfEmpty(v);
  if (x === null) return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

/**
 * Guard: check-in tidak boleh di masa lalu (Asia/Jakarta)
 * body.check_in_at format: YYYY-MM-DD
 */
function isPastDateISO(dateStr) {
  const d = new Date(dateStr + "T00:00:00+07:00");
  const todayISO = getTodayISO_WIB();
  const wibToday = new Date(`${todayISO}T00:00:00+07:00`);
  return d < wibToday;
}

/**
 * Normalisasi payload create stay:
 * - Base/agreed tidak diisi dari form -> dihitung di service (server-side truth)
 * - additional & discount boleh kosong -> default 0 di service
 */
function normalizeCreatePayload(body = {}) {
  return {
    tenant_id: toIntOrNull(body.tenant_id),
    room_id: toIntOrNull(body.room_id),

    check_in_at: toNullIfEmpty(body.check_in_at),
    rent_period: toNullIfEmpty(body.rent_period) || "MONTHLY",

    additional_rent_amount: toNumOrNull(body.additional_rent_amount) ?? 0,
    additional_rent_reason: toNullIfEmpty(body.additional_rent_reason),

    discount_amount: toNumOrNull(body.discount_amount) ?? 0,
    discount_reason: toNullIfEmpty(body.discount_reason),

    deposit_amount: toNumOrNull(body.deposit_amount), // null => default from room_type in service
    billing_anchor_day: toIntOrNull(body.billing_anchor_day),

    electricity_mode: toNullIfEmpty(body.electricity_mode) || "METERED",
    electricity_fixed_amount: toNumOrNull(body.electricity_fixed_amount) ?? 0,
    water_fixed_amount: toNumOrNull(body.water_fixed_amount) ?? 0,
    internet_fixed_amount: toNumOrNull(body.internet_fixed_amount) ?? 0,

    notes: toNullIfEmpty(body.notes),
    created_by: body.created_by ? toIntOrNull(body.created_by) : null,
  };
}


// ---------- controllers ----------
async function renderStayNewForm(req, res, next) {
  try {
    const wibNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
const yyyy = wibNow.getFullYear();
const mm = String(wibNow.getMonth() + 1).padStart(2, "0");
const dd = String(wibNow.getDate()).padStart(2, "0");
const todayISO = `${yyyy}-${mm}-${dd}`;

    const [roomsRes, tenantsRes] = await Promise.all([
      stayRepo.listAvailableRooms(),
      stayRepo.listActiveTenants(),
    ]);

    return res.render("kost/stays/new", {
      title: "New Stay",
      rooms: roomsRes?.rows ?? [],
      tenants: tenantsRes?.rows ?? [],
      form: pickForm({}),
      error: null,
      todayISO: getTodayISO_WIB(), // ✅ untuk min date di EJS
    });
  } catch (err) {
    return next(err);
  }
}



async function renderStayDetail(req, res, next) {
  try {
    const stayId = toIntOrNull(req.params.id);
    if (!stayId) {
      const e = new Error("Invalid stay id");
      e.status = 400;
      throw e;
    }

    const result = await stayRepo.getStayById(stayId);
    const stay = result?.rows?.[0];

    if (!stay) {
      const e = new Error("Stay not found");
      e.status = 404;
      throw e;
    }

    return res.render("kost/stays/detail", { title: `Stay #${stay.id}`, stay });
  } catch (err) {
    return next(err);
  }
}

async function createStay(req, res, next) {
  try {
    const payload = normalizeCreatePayload(req.body);

    if (!payload.tenant_id || !payload.room_id || !payload.check_in_at) {
      const e = new Error("Tenant, Room, and Check-in date are required");
      e.status = 400;
      throw e;
    }

    if (isPastDateISO(payload.check_in_at)) {
      const e = new Error("Check-in date cannot be in the past");
      e.status = 400;
      throw e;
    }

    // ✅ Create via service (server recompute base + agreed, planned checkout auto)
    const created = await stayService.createStay(payload);

    if (!created?.id) {
      const e = new Error("Failed to create stay");
      e.status = 400;
      throw e;
    }

    return res.redirect(`/admin/kost/stays/${created.id}`);
  } catch (err) {
    try {
      const wibNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
const yyyy = wibNow.getFullYear();
const mm = String(wibNow.getMonth() + 1).padStart(2, "0");
const dd = String(wibNow.getDate()).padStart(2, "0");
const todayISO = `${yyyy}-${mm}-${dd}`;

      const [roomsRes, tenantsRes] = await Promise.all([
        stayRepo.listAvailableRooms(),
        stayRepo.listActiveTenants(),
      ]);

        return res.status(err.status || 400).render("kost/stays/new", {
        title: "New Stay",
        rooms: roomsRes?.rows ?? [],
        tenants: tenantsRes?.rows ?? [],
        form: pickForm(req.body),
        error: err.message || "Failed to create stay" ,
        todayISO: getTodayISO_WIB(), // ✅ untuk min date di EJS
      });
    } catch {
      return next(err);
    }
  }
}

/**
 * Preferred term: Checkout (ENDED)
 */
async function checkoutStay(req, res, next) {
  try {
    const stayId = toIntOrNull(req.params.id);
    if (!stayId) {
      const e = new Error("Invalid stay id");
      e.status = 400;
      throw e;
    }

    await stayService.checkoutStay(stayId);
    return res.redirect(`/admin/kost/stays/${stayId}`);
  } catch (err) {
    return next(err);
  }
}

/**
 * Alias: endStay (backward compatible)
 */
async function endStay(req, res, next) {
  try {
    const stayId = toIntOrNull(req.params.id);
    if (!stayId) {
      const e = new Error("Invalid stay id");
      e.status = 400;
      throw e;
    }

    await stayService.endStay(stayId);
    return res.redirect(`/admin/kost/stays/${stayId}`);
  } catch (err) {
    return next(err);
  }
}
async function renderStaysList(req, res, next) {
  try {
    const rawStatus = req.query.status ?? "ALL";
    const status = rawStatus === "ALL" ? null : rawStatus;

    const currentYear = Number(getTodayISO_WIB().slice(0, 4));
    const year = Number.parseInt(req.query.year, 10) || currentYear;

    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y -= 1) years.push(y);

    const date_from = `${year}-01-01`;
    const date_to = `${year + 1}-01-01`;

    // UI belum pakai tenant/room filter → set null
    const tenant_id = null;
    const room_id = null;

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
const limit = Math.min(200, Math.max(10, Number.parseInt(req.query.limit, 10) || 50));
const offset = (page - 1) * limit;

const baseFilters = {
  status,
  tenant_id: null,
  room_id: null,
  date_from,
  date_to,
};

const [countRes, listRes] = await Promise.all([
  stayRepo.countStaysFiltered(baseFilters),
  stayRepo.listStaysFiltered({ ...baseFilters, limit, offset }),
]);

const totalRows = Number(countRes?.rows?.[0]?.total || 0);
const totalPages = Math.max(1, Math.ceil(totalRows / limit));

// clamp page kalau user request page terlalu besar
if (page > totalPages) {
  page = totalPages;
  offset = (page - 1) * limit;
  const listRes2 = await stayRepo.listStaysFiltered({ ...baseFilters, limit, offset });
  return res.render("kost/stays/index", {
    title: "Stays",
    stays: listRes2?.rows ?? [],
    years,
    pagination: { page, limit, totalRows, totalPages },
    filters: { status: rawStatus, year, page, limit },
  });
}

    const result = await stayRepo.listStaysFiltered({ status, tenant_id:null, room_id:null, date_from, date_to,limit, offset });
    const stays = result?.rows ?? [];

    return res.render("kost/stays/index", {
      title: "Stays",
      stays,
      years,
      pagination: { page, limit, totalRows, totalPages },
      filters: { status: rawStatus, year, page, limit },
    });
  } catch (err) {
    return next(err);
  }
}


module.exports = {
  renderStaysList,
  renderStayNewForm,
  renderStayDetail,
  createStay,
  checkoutStay,
  endStay,
};
