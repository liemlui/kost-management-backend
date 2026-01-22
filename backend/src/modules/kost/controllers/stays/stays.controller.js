// modules/kost/controllers/stays/stays.controller.js
const stayRepo = require("../../repos/stays/stay.repo");

function pickForm(body = {}) {
  return {
    tenant_id: body.tenant_id || "",
    room_id: body.room_id || "",
    check_in_at: body.check_in_at || "",
    planned_check_out_at: body.planned_check_out_at || "",
    rent_period: body.rent_period || "MONTHLY",
    agreed_rent_amount: body.agreed_rent_amount || "",
    deposit_amount: body.deposit_amount || "",
    billing_anchor_day: body.billing_anchor_day || "",
    electricity_mode: body.electricity_mode || "METERED",
    electricity_fixed_amount: body.electricity_fixed_amount || "",
    water_fixed_amount: body.water_fixed_amount || "",
    internet_fixed_amount: body.internet_fixed_amount || "",
    notes: body.notes || "",
  };
}

exports.renderStaysList = async (req, res, next) => {
  try {
    const status = req.query.status || "ACTIVE"; // default ACTIVE
    const q = req.query.q || "";

    const stays = await stayRepo.listStays({ status, q });

    return res.render("kost/stays/index", {
      title: "Stays",
      stays,
      filters: { status, q },
    });
  } catch (err) {
    return next(err);
  }
};

exports.renderStayNewForm = async (req, res, next) => {
  try {
    const [rooms, tenants] = await Promise.all([
      stayRepo.listAvailableRooms(),
      stayRepo.listActiveTenants(),
    ]);

    return res.render("kost/stays/new", {
      title: "New Stay",
      rooms,
      tenants,
      form: pickForm({}),
      error: null,
    });
  } catch (err) {
    return next(err);
  }
};

exports.renderStayDetail = async (req, res, next) => {
  try {
    const stay = await stayRepo.getStayById(req.params.id);
    if (!stay) {
      const e = new Error("Stay not found");
      e.status = 404;
      throw e;
    }
    return res.render("kost/stays/detail", { title: `Stay #${stay.id}`, stay });
  } catch (err) {
    return next(err);
  }
};

exports.createStay = async (req, res, next) => {
  try {
    const id = await stayRepo.createStay(req.body);
    // detail page exists (we'll add detail.ejs)
    return res.redirect(`/admin/kost/stays/${id}`);
  } catch (err) {
    // re-render form with rooms+tenants
    try {
      const [rooms, tenants] = await Promise.all([
        stayRepo.listAvailableRooms(),
        stayRepo.listActiveTenants(),
      ]);
      return res.status(err.status || 400).render("kost/stays/new", {
        title: "New Stay",
        rooms,
        tenants,
        form: pickForm(req.body),
        error: err.message || "Failed to create stay",
      });
    } catch (e2) {
      return next(err); // fallback to original error
    }
  }
};

exports.endStay = async (req, res, next) => {
  try {
    const todayISO = new Date().toISOString().slice(0, 10); // stays.check_out_at is DATE
    const updated = await stayRepo.endStay(req.params.id, todayISO);

    if (!updated) {
      const e = new Error("Stay cannot be ended (not ACTIVE or not found)");
      e.status = 400;
      throw e;
    }

    return res.redirect(`/admin/kost/stays/${req.params.id}`);
  } catch (err) {
    return next(err);
  }
};
