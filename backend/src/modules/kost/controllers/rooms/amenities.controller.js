// modules/kost/controllers/rooms/amenities.controller.js

const amenityRepo = require("../../repos/rooms/amenity.repo.js");
const { toIntOrNull, toBool } = require("../../../../shared/parsers");
const { setFlash, setFlashErrors } = require("../../../../shared/flash");
const logger = require("../../../../config/logger");

// GET /admin/kost/amenities
async function listAmenities(req, res, next) {
  try {
    const amenities = await amenityRepo.listAmenities();
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
    errors: [],
  });
}

// POST /admin/kost/amenities
async function createAmenity(req, res, next) {
  try {
    const payload = {
      code: (req.body.code || "").trim(),
      name: (req.body.name || "").trim(),
      category: (req.body.category || "").trim(),
      unit_label: (req.body.unit_label || "").trim() || null,
      is_active: toBool(req.body.is_active),
    };

    const errors = [];
    if (!payload.code) errors.push("Code wajib diisi.");
    if (!payload.name) errors.push("Name wajib diisi.");
    if (!payload.category) errors.push("Category wajib diisi.");

    if (errors.length) {
      await setFlashErrors(req, errors);
      return res.status(400).render("kost/amenities/form", {
        title: "New Amenity",
        mode: "create",
        amenity: payload,
        formAction: "/admin/kost/amenities",
        query: req.query,
        errors,
      });
    }

    await amenityRepo.insertAmenity(payload);
    await setFlash(req, "success", "Amenity berhasil dibuat");
    return res.redirect("/admin/kost/amenities");
  } catch (err) {
    logger.error("amenities.create.error", { error: err.message, code: err.code });

    if (err.code === "23505") {
      const msg = "Amenity code sudah dipakai (harus unique).";
      await setFlashErrors(req, msg);
      return res.status(400).render("kost/amenities/form", {
        title: "New Amenity",
        mode: "create",
        amenity: req.body,
        formAction: "/admin/kost/amenities",
        query: req.query,
        errors: [msg],
      });
    }

    next(err);
  }
}

// GET /admin/kost/amenities/:id/edit
async function editAmenityForm(req, res, next) {
  try {
    const id = toIntOrNull(req.params.id);
    if (!id) return res.status(400).send("Invalid id");

    const amenity = await amenityRepo.getAmenityById(id);
    if (!amenity) return res.status(404).send("Amenity not found");

    res.render("kost/amenities/form", {
      title: `Edit Amenity — ${amenity.code}`,
      mode: "edit",
      amenity,
      formAction: `/admin/kost/amenities/${id}`,
      query: req.query,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
}

// POST /admin/kost/amenities/:id
async function updateAmenity(req, res, next) {
  try {
    const id = toIntOrNull(req.params.id);
    if (!id) return res.status(400).send("Invalid id");

    const payload = {
      code: (req.body.code || "").trim(),
      name: (req.body.name || "").trim(),
      category: (req.body.category || "").trim(),
      unit_label: (req.body.unit_label || "").trim() || null,
      is_active: toBool(req.body.is_active),
    };

    const errors = [];
    if (!payload.code) errors.push("Code wajib diisi.");
    if (!payload.name) errors.push("Name wajib diisi.");
    if (!payload.category) errors.push("Category wajib diisi.");

    if (errors.length) {
      await setFlashErrors(req, errors);
      return res.status(400).render("kost/amenities/form", {
        title: `Edit Amenity — ${payload.code || ""}`,
        mode: "edit",
        amenity: payload,
        formAction: `/admin/kost/amenities/${id}`,
        query: req.query,
        errors,
      });
    }

    await amenityRepo.updateAmenity(id, payload);
    await setFlash(req, "success", "Amenity berhasil diupdate");
    return res.redirect(`/admin/kost/amenities/${id}/edit?updated=1`);
  } catch (err) {
    if (err.code === "23505") {
      const msg = "Amenity code sudah dipakai (harus unique).";
      await setFlashErrors(req, msg);
      return res.status(400).send(msg);
    }
    next(err);
  }
}

// POST /admin/kost/amenities/:id/toggle
async function toggleAmenityActive(req, res, next) {
  try {
    const id = toIntOrNull(req.params.id);
    if (!id) return res.status(400).send("Invalid id");

    await amenityRepo.toggleAmenityActive(id);
    await setFlash(req, "success", "Amenity status berhasil diubah");
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
