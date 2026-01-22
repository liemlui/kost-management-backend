// modules/kost/controllers/rooms/amenities.controller.js
const amenityRepo = require("../../repos/rooms/amenity.repo.js");

// GET /admin/kost/amenities
async function listAmenities(req, res, next) {
  try {
    const rows = await amenityRepo.listAmenities();
    // listAmenities di repo kamu mungkin return query result atau rows.
    // Kalau repo kamu return `query(...)` mentah: pakai `.rows`.
    const amenities = Array.isArray(rows) ? rows : (rows.rows || []);
    res.render("kost/amenities/index", {
      title: "Amenities",
      amenities,
    });
  } catch (err) {
    next(err);
  }
}

// GET /admin/kost/amenities/new
function newAmenityForm(req, res) {
  res.render("kost/amenities/form", {
    title: "New Amenity",
    mode: "create",
    amenity: { code: "", name: "", category: "", unit_label: "", is_active: true },
    formAction: "/admin/kost/amenities",
    query: req.query,
  });
}

// POST /admin/kost/amenities
async function createAmenity(req, res, next) {
  try {
    console.log("[CREATE AMENITY] body =", req.body);

    const payload = {
      code: (req.body.code || "").trim(),
      name: (req.body.name || "").trim(),
      category: (req.body.category || "").trim(),
      unit_label: (req.body.unit_label || "").trim() || null,
      is_active:
        req.body.is_active === "on" ||
        req.body.is_active === "true" ||
        req.body.is_active === "1",
    };

    console.log("[CREATE AMENITY] payload =", payload);

    const result = await amenityRepo.insertAmenity(payload);

    console.log("[CREATE AMENITY] inserted =", result);

    return res.redirect("/admin/kost/amenities");
  } catch (err) {
    console.error("[CREATE AMENITY ERROR]", err);
    next(err);
  }
}


// GET /admin/kost/amenities/:id/edit
async function editAmenityForm(req, res, next) {
  try {
    const id = Number(req.params.id);
    const amenity = await amenityRepo.getAmenityById(id);
    if (!amenity) return res.status(404).send("Amenity not found");

    res.render("kost/amenities/form", {
      title: `Edit Amenity — ${amenity.code}`,
      mode: "edit",
      amenity,
      formAction: `/admin/kost/amenities/${id}`,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
}

// POST /admin/kost/amenities/:id
async function updateAmenity(req, res, next) {
  try {
    const id = Number(req.params.id);
    const payload = {
      code: (req.body.code || "").trim(),
      name: (req.body.name || "").trim(),
      category: (req.body.category || "").trim(),
      unit_label: (req.body.unit_label || "").trim() || null,
      is_active: req.body.is_active === "on" || req.body.is_active === "true" || req.body.is_active === "1",
    };

    await amenityRepo.updateAmenity(id, payload);
    return res.redirect(`/admin/kost/amenities/${id}/edit?updated=1`);
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(400).send("Amenity code already exists.");
    }
    next(err);
  }
}

// POST /admin/kost/amenities/:id/toggle
async function toggleAmenityActive(req, res, next) {
  try {
    const id = Number(req.params.id);
    await amenityRepo.toggleAmenityActive(id);
    return res.redirect("/admin/kost/amenities");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAmenities,
  newAmenityForm,
  createAmenity,
  editAmenityForm,
  updateAmenity,
  toggleAmenityActive,
};
