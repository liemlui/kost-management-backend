// modules/kost/controllers/tenants/tenants.controller.js
const tenantRepo = require("../../repos/tenants/tenant.repo");

function normalizePhoneTo62(raw) {
  if (raw == null) return null;

  let s = String(raw).trim();
  if (!s) return null;

  // remove common separators
  s = s.replace(/[ \t\r\n()-]/g, "");

  // allow leading +
  if (s.startsWith("+")) {
    // keep +, but remove any non-digits after it
    s = "+" + s.slice(1).replace(/\D/g, "");
  } else {
    // remove non-digits
    s = s.replace(/\D/g, "");

    // normalize to +62
    if (s.startsWith("62")) s = "+62" + s.slice(2);
    else if (s.startsWith("0")) s = "+62" + s.slice(1);
    else if (s.startsWith("8")) s = "+62" + s; // user input like 8123...
    else s = "+62" + s; // fallback
  }

  // validate: only +digits, 8-20 digits total (excluding +)
  if (!/^\+[0-9]{8,20}$/.test(s)) return null;

  return s;
}

function buildTenantPayload(body) {
  return {
    full_name: (body.full_name || "").trim(),
    phone: normalizePhoneTo62(body.phone),
    email: (body.email || "").trim() || null,
    id_number: (body.id_number || "").trim() || null,
    emergency_contact_name: (body.emergency_contact_name || "").trim() || null,
    emergency_contact_phone: normalizePhoneTo62(body.emergency_contact_phone),
    notes: (body.notes || "").trim() || null,
  };
}

function validateTenant(payload) {
  const errors = [];
  if (!payload.full_name) errors.push("Full name is required.");

  // phone optional, tapi kalau user isi dan invalid => error
  if (payload.phone === null && (payload._rawPhoneFilled === true)) {
    errors.push("Phone number is invalid. Use Indonesian format, e.g. 0812... (we will save as +62...).");
  }

  // emergency phone optional, tapi kalau user isi dan invalid => error
  if (payload.emergency_contact_phone === null && (payload._rawEmergencyPhoneFilled === true)) {
    errors.push("Emergency phone is invalid. Use 08... (we will save as +62...).");
  }

  return errors;
}

exports.renderTenantsList = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const is_active = (req.query.is_active || "").trim(); // "", "true", "false"

    const { rows } = await tenantRepo.listTenants({ q, is_active });

    return res.render("kost/tenants/index", {
      title: "Tenants",
      tenants: rows,
      q,
      is_active,
    });
  } catch (err) {
    return next(err);
  }
};

exports.renderTenantNewForm = async (req, res) => {
  return res.render("kost/tenants/new", {
    title: "Create Tenant",
    errors: [],
    form: {},
  });
};

exports.createTenant = async (req, res, next) => {
  try {
    const payload = buildTenantPayload(req.body);

    // flags to detect "user filled but invalid"
    payload._rawPhoneFilled = !!(req.body.phone && String(req.body.phone).trim());
    payload._rawEmergencyPhoneFilled = !!(
      req.body.emergency_contact_phone && String(req.body.emergency_contact_phone).trim()
    );

    const errors = validateTenant(payload);
    if (errors.length) {
      return res.status(400).render("kost/tenants/new", {
        title: "Create Tenant",
        errors,
        form: req.body,
      });
    }

    const result = await tenantRepo.insertTenant(payload);
    const id = result.rows?.[0]?.id;

    // redirect ke detail biar kerasa "sukses"
    if (id) return res.redirect(`/admin/kost/tenants/${id}`);
    return res.redirect("/admin/kost/tenants");
  } catch (err) {
    return next(err);
  }
};

exports.renderTenantDetail = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await tenantRepo.getTenantById(id);

    if (!rows.length) {
      return res.status(404).send("Tenant not found");
    }

    return res.render("kost/tenants/detail", {
      title: "Tenant Detail",
      tenant: rows[0],
    });
  } catch (err) {
    return next(err);
  }
};

exports.renderTenantEditForm = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await tenantRepo.getTenantById(id);

    if (!rows.length) {
      return res.status(404).send("Tenant not found");
    }

    return res.render("kost/tenants/edit", {
      title: "Edit Tenant",
      errors: [],
      tenant: rows[0],
      form: rows[0],
    });
  } catch (err) {
    return next(err);
  }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const payload = buildTenantPayload(req.body);
    payload._rawPhoneFilled = !!(req.body.phone && String(req.body.phone).trim());
    payload._rawEmergencyPhoneFilled = !!(
      req.body.emergency_contact_phone && String(req.body.emergency_contact_phone).trim()
    );

    const errors = validateTenant(payload);
    if (errors.length) {
      // butuh data tenant existing untuk render form (biar ada is_active, etc)
      const existing = await tenantRepo.getTenantById(id);
      if (!existing.rows.length) return res.status(404).send("Tenant not found");

      return res.status(400).render("kost/tenants/edit", {
        title: "Edit Tenant",
        errors,
        tenant: existing.rows[0],
        form: { ...existing.rows[0], ...req.body },
      });
    }

    await tenantRepo.updateTenant(id, payload);
    return res.redirect(`/admin/kost/tenants/${id}`);
  } catch (err) {
    return next(err);
  }
};

exports.toggleTenantActive = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await tenantRepo.toggleTenantActive(id);
    return res.redirect(`/admin/kost/tenants/${id}`);
  } catch (err) {
    return next(err);
  }
};
