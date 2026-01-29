// modules/kost/controllers/stays/stays.controller.js
const stayRepo = require("../../repos/stays/stay.repo");
const { get } = require("../../routes");
const stayService = require("../../services/stays/stay.service");
const {
  toNullIfEmpty,
  toIntOrNull,
  toNumOrNull,
} = require("../../../../shared/parsers");

const { todayISO_WIB } = require("../../../../shared/dates");

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
    room_variant: body.room_variant || "",
    is_active: body.is_active || "",
    notes: body.notes || "",
  };
}

function isPastDateISO(dateISO, todayISO) {
  if (!dateISO) return false;
  return dateISO < todayISO;
}

// ---------- controllers ----------

async function index(req, res, next) {
  try {
    const rawStatus = (req.query.status || "ACTIVE").trim().toUpperCase();
    const status = rawStatus === "ALL" ? null : rawStatus;

    const currentYear = Number(todayISO_WIB().slice(0, 4));
    // ✅ parsing-only refactor: preserves default behavior
    const year = toIntOrNull(req.query.year) ?? currentYear;

    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y -= 1) years.push(y);

    const date_from = `${year}-01-01`;
    const date_to = `${year}-12-31`;

    const [stays, rooms, tenants] = await Promise.all([
      stayRepo.listStays({ status, date_from, date_to }),
      stayRepo.listRooms(),
      stayRepo.listTenants(),
    ]);

    res.render("kost/stays/index", {
      title: "Stays",
      stays,
      rooms,
      tenants,
      years,
      query: req.query,
      filters: {
        status,
        year,
        date_from,
        date_to,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function showNew(req, res, next) {
  try {
    const today = todayISO_WIB();
    const [rooms, tenants] = await Promise.all([
      stayRepo.listRooms({ onlyAvailable: true }),
      stayRepo.listTenants(),
    ]);

    res.render("kost/stays/form", {
      title: "New Stay",
      mode: "create",
      action: "/admin/kost/stays",
      rooms,
      tenants,
      form: pickForm({
        check_in_at: today,
        rent_period: "MONTHLY",
        electricity_mode: "METERED",
      }),
      errors: [],
      todayISO: today,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const today = todayISO_WIB();
    const form = pickForm(req.body);

    const payload = {
      tenant_id: toIntOrNull(form.tenant_id),
      room_id: toIntOrNull(form.room_id),
      check_in_at: toNullIfEmpty(form.check_in_at),
      rent_period: toNullIfEmpty(form.rent_period),

      additional_rent_amount: toNumOrNull(form.additional_rent_amount) || 0,
      additional_rent_reason: toNullIfEmpty(form.additional_rent_reason),

      discount_amount: toNumOrNull(form.discount_amount) || 0,
      discount_reason: toNullIfEmpty(form.discount_reason),

      deposit_amount: toNumOrNull(form.deposit_amount) || 0,

      billing_anchor_day: toIntOrNull(form.billing_anchor_day),
      electricity_mode: toNullIfEmpty(form.electricity_mode),
      electricity_fixed_amount: toNumOrNull(form.electricity_fixed_amount) || 0,
      water_fixed_amount: toNumOrNull(form.water_fixed_amount) || 0,
      internet_fixed_amount: toNumOrNull(form.internet_fixed_amount) || 0,

      room_variant: toNullIfEmpty(form.room_variant),
      notes: toNullIfEmpty(form.notes),
    };

    const errors = [];

    if (!payload.tenant_id) errors.push("Tenant wajib dipilih.");
    if (!payload.room_id) errors.push("Room wajib dipilih.");
    if (!payload.check_in_at) errors.push("Check-in date wajib diisi.");
    if (payload.check_in_at && isPastDateISO(payload.check_in_at, today)) {
      errors.push("Check-in date tidak boleh di masa lalu (WIB).");
    }
    if (!payload.rent_period) errors.push("Rent period wajib dipilih.");

    if (!payload.billing_anchor_day) errors.push("Billing anchor day wajib diisi.");

    if (!payload.electricity_mode) errors.push("Electricity mode wajib dipilih.");
    if (payload.electricity_mode === "FIXED" && payload.electricity_fixed_amount <= 0) {
      errors.push("Electricity fixed amount wajib > 0 jika mode FIXED.");
    }

    if (errors.length) {
      const [rooms, tenants] = await Promise.all([
        stayRepo.listRooms({ onlyAvailable: true }),
        stayRepo.listTenants(),
      ]);

      return res.status(400).render("kost/stays/form", {
        title: "New Stay",
        mode: "create",
        action: "/admin/kost/stays",
        rooms,
        tenants,
        form,
        errors,
        todayISO: today,
      });
    }

    await stayService.createStay(payload, req.user?.id || null);
    return res.redirect("/admin/kost/stays");
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const stayId = Number(req.params.id);
    const stay = await stayRepo.getStayById(stayId);
    if (!stay) return res.status(404).send("Stay not found");

    res.render("kost/stays/detail", {
      title: `Stay #${stayId}`,
      stay,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
}

async function checkout(req, res, next) {
  try {
    const stayId = Number(req.params.id);
    const today = todayISO_WIB();
    await stayService.checkoutStay(stayId, today, req.user?.id || null);
    return res.redirect(`/admin/kost/stays/${stayId}?checked_out=1`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  index,
  showNew,
  create,
  detail,
  checkout,
};
