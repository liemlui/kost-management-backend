const locationsRepo = require("../../repos/inventory/inventoryLocations.repo");
const roomLookupRepo = require("../../repos/rooms/roomLookup.repo");
const { toSelectIntOrNull, toBool, toNullIfEmpty } = require("../../../../shared/parsers");

// v1 whitelist
const LOCATION_TYPES = ["GENERAL", "ROOM"];

function normalizePayload(body) {
  return {
    name: toNullIfEmpty(body.name),
    location_type: (body.location_type || "").trim().toUpperCase(),
    room_id: toSelectIntOrNull(body.room_id),
    is_active: toBool(body.is_active),
  };
}

function validatePayload(p) {
  const errors = [];
  if (!p.name) errors.push("Nama lokasi wajib diisi.");

  if (!p.location_type) errors.push("Location type wajib dipilih.");
  else if (!LOCATION_TYPES.includes(p.location_type)) {
    errors.push(`Location type tidak valid. Pilihan: ${LOCATION_TYPES.join(", ")}`);
  }

  // Rule: ROOM => room_id wajib
  if (p.location_type === "ROOM" && !p.room_id) {
    errors.push("Untuk location type ROOM, Room ID wajib diisi.");
  }

  // Rule: GENERAL => room_id harus null
  if (p.location_type === "GENERAL") {
    p.room_id = null;
  }

  return errors;
}

async function index(req, res, next) {
  try {
    const locations = await locationsRepo.listLocations();
    res.render("kost/inventory/locations/index", {
      title: "Inventory Locations",
      locations,
    });
  } catch (err) {
    next(err);
  }
}

async function showNewForm(req, res, next) {
  try {
    const rooms = await roomLookupRepo.listRoomsForDropdown();

    res.render("kost/inventory/locations/form", {
      title: "New Inventory Location",
      form: { location_type: "", is_active: true },
      errors: [],
      rooms,
      locationTypes: LOCATION_TYPES,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const rooms = await roomLookupRepo.listRoomsForDropdown();
    const roomMap = new Map((rooms || []).map((r) => [Number(r.id), r.code || null]));

    const payload = normalizePayload(req.body);

    if (payload.location_type === "ROOM") {
      const code = roomMap.get(Number(payload.room_id));
      if (code) payload.name = code;
    }

    const errors = validatePayload(payload);

    if (errors.length) {
      return res.status(400).render("kost/inventory/locations/form", {
        title: "New Inventory Location",
        form: req.body,
        errors,
        rooms,
        locationTypes: LOCATION_TYPES,
      });
    }

    await locationsRepo.insertLocation(payload);
    return res.redirect("/admin/kost/inventory/locations");
  } catch (err) {
    next(err);
  }
}

async function showEditForm(req, res, next) {
  try {
    const rooms = await roomLookupRepo.listRoomsForDropdown();
    const location = await locationsRepo.getById(req.params.id);
    if (!location) return res.status(404).send("Location not found");

    res.render("kost/inventory/locations/form", {
      title: "Edit Inventory Location",
      form: location,
      errors: [],
      rooms,
      locationTypes: LOCATION_TYPES,
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const rooms = await roomLookupRepo.listRoomsForDropdown();
    const roomMap = new Map((rooms || []).map((r) => [Number(r.id), r.code || null]));

    const payload = normalizePayload(req.body);

    if (payload.location_type === "ROOM") {
      const code = roomMap.get(Number(payload.room_id));
      if (code) payload.name = code;
    }

    const errors = validatePayload(payload);

    if (errors.length) {
      return res.status(400).render("kost/inventory/locations/form", {
        title: "Edit Inventory Location",
        form: { ...req.body, id: req.params.id },
        errors,
        rooms,
        locationTypes: LOCATION_TYPES,
      });
    }

    await locationsRepo.updateLocation(req.params.id, payload);
    return res.redirect("/admin/kost/inventory/locations");
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await locationsRepo.softDelete(req.params.id);
    return res.redirect("/admin/kost/inventory/locations");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  index,
  showNewForm,
  create,
  showEditForm,
  update,
  remove,
};
