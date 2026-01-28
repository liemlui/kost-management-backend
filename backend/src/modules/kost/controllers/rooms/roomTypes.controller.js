// modules/kost/controllers/rooms/roomTypes.controller.js
const repo = require("../../repos/rooms/roomTypes.repo");
const { toIntOrNull, toBool } = require("../../../../shared/parsers");

function parseNum(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "" || s.toLowerCase() === "false") return null; // <- penting (placeholder select)
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeBathroom(form, errors) {
  // DB: bathroom_location NOT NULL, allowed INSIDE|OUTSIDE
  let loc = (form.bathroom_location || "OUTSIDE").trim().toUpperCase();
  if (loc !== "INSIDE" && loc !== "OUTSIDE") loc = "OUTSIDE";

  if (loc === "OUTSIDE") {
    // DB constraint: OUTSIDE => bathroom_width_m & bathroom_length_m MUST be NULL
    return {
      bathroom_location: "OUTSIDE",
      bathroom_width_m: null,
      bathroom_length_m: null,
    };
  }

  // INSIDE => required both
  const bw = parseNum(form.bathroom_width_m);
  const bl = parseNum(form.bathroom_length_m);

  if (bw === null || bl === null) {
    errors.push(
      "Bathroom width & length are required when Bathroom Location is INSIDE."
    );
  }

  return {
    bathroom_location: "INSIDE",
    bathroom_width_m: bw,
    bathroom_length_m: bl,
  };
}

async function list(req, res) {
  const roomTypes = await repo.listRoomTypes();

  const total_types = roomTypes.length;
  const active_types = roomTypes.filter((rt) => rt.is_active).length;
  const inactive_types = total_types - active_types;

  const used_types = roomTypes.filter((rt) => Number(rt.rooms_count || 0) > 0).length;
  const unused_types = total_types - used_types;

  const total_rooms = roomTypes.reduce(
    (acc, rt) => acc + Number(rt.rooms_count || 0),
    0
  );

  const top_used = [...roomTypes]
    .sort((a, b) => Number(b.rooms_count || 0) - Number(a.rooms_count || 0))
    .slice(0, 5);

  res.render("kost/roomTypes/index", {
    title: "Room Types",
    roomTypes,
    usage: {
      total_types,
      active_types,
      inactive_types,
      used_types,
      unused_types,
      total_rooms,
      top_used,
    },
  });
}

async function showNew(req, res) {
  const flash = req.session?.flash;
  if (req.session) req.session.flash = null;

  if (flash) {
    return res.render("kost/roomTypes/form", {
      title: "New Room Type",
      mode: "new",
      action: "/admin/kost/room-types",
      errors: flash.errors || [],
      form: flash.form || {},
    });
  }

  return res.render("kost/roomTypes/form", {
    title: "New Room Type",
    mode: "new",
    action: "/admin/kost/room-types",
    errors: [],
    form: {
      code: "",
      name: "",
      base_monthly_price: "",
      deposit_amount: "",
      is_capsule: false,
      room_width_m: "",
      room_length_m: "",
      bathroom_location: "OUTSIDE",
      bathroom_width_m: "",
      bathroom_length_m: "",
      has_ac: false,
      has_fan: false,
      bed_type: "",
      bed_size_cm: "",
      is_active: true,
      notes: "",
    },
  });
}

async function create(req, res) {
  const errors = [];
  const form = {
    code: (req.body.code || "").trim(),
    name: (req.body.name || "").trim(),
    base_monthly_price: req.body.base_monthly_price,
    deposit_amount: req.body.deposit_amount ?? "",
    is_capsule: toBool(req.body.is_capsule),
    room_width_m: req.body.room_width_m,
    room_length_m: req.body.room_length_m,
    bathroom_location: req.body.bathroom_location || "OUTSIDE",
    bathroom_width_m: req.body.bathroom_width_m,
    bathroom_length_m: req.body.bathroom_length_m,
    has_ac: toBool(req.body.has_ac),
    has_fan: toBool(req.body.has_fan),
    bed_type: (req.body.bed_type || "").trim(),
    bed_size_cm: req.body.bed_size_cm,
    is_active: toBool(req.body.is_active),
    notes: (req.body.notes || "").trim(),
  };

  if (!form.code) errors.push("Code is required.");
  if (!form.name) errors.push("Name is required.");

  const allowedBedTypes = new Set(["FOAM", "SPRINGBED"]);
  let bed_type = (form.bed_type || "").trim().toUpperCase();

  if (!bed_type) {
    errors.push("Bed type is required.");
  } else if (!allowedBedTypes.has(bed_type)) {
    errors.push("Bed type must be FOAM or SPRINGBED.");
  }

  const bath = normalizeBathroom(form, errors);

  if (errors.length) {
    if (req.session) {
      req.session.flash = { errors, form: { ...form, ...bath } };
      return res.redirect("/admin/kost/room-types/new");
    }

    return res.status(400).render("kost/roomTypes/form", {
      title: "New Room Type",
      mode: "new",
      action: "/admin/kost/room-types",
      errors,
      form: { ...form, ...bath },
    });
  }

  const payload = {
    code: form.code,
    name: form.name,
    base_monthly_price: parseNum(form.base_monthly_price) ?? 0,
    deposit_amount: parseNum(form.deposit_amount) ?? 0,
    is_capsule: toBool(form.is_capsule),
    room_width_m: parseNum(form.room_width_m) ?? null,
    room_length_m: parseNum(form.room_length_m) ?? null,
    bathroom_location: bath.bathroom_location,
    bathroom_width_m: bath.bathroom_width_m,
    bathroom_length_m: bath.bathroom_length_m,
    has_ac: toBool(form.has_ac),
    has_fan: toBool(form.has_fan),
    bed_type: bed_type,
    bed_size_cm: toIntOrNull(form.bed_size_cm),
    is_active: toBool(form.is_active),
    notes: form.notes || null,
  };

  try {
    await repo.insertRoomType(payload);
    return res.redirect("/admin/kost/room-types");
  } catch (err) {
    if (err && err.code === "23505") {
      const dupErrors = ["Code already exists. Please use a different code."];

      if (req.session) {
        req.session.flash = {
          errors: dupErrors,
          form: { ...form, ...bath },
        };
        return res.redirect("/admin/kost/room-types/new");
      }

      return res.status(400).render("kost/roomTypes/form", {
        title: "New Room Type",
        mode: "new",
        action: "/admin/kost/room-types",
        errors: dupErrors,
        form: { ...form, ...bath },
      });
    }

    throw err;
  }
}

async function showEdit(req, res) {
  const id = req.params.id;
  const rt = await repo.getRoomTypeById(id);
  if (!rt) return res.status(404).send("Room type not found");

  const form = {
    code: rt.code || "",
    name: rt.name || "",
    base_monthly_price: rt.base_monthly_price ?? "",
    deposit_amount: rt.deposit_amount ?? "",
    is_capsule: toBool(rt.is_capsule),
    room_width_m: rt.room_width_m ?? "",
    room_length_m: rt.room_length_m ?? "",
    bathroom_location: rt.bathroom_location || "OUTSIDE",
    bathroom_width_m: rt.bathroom_width_m ?? "",
    bathroom_length_m: rt.bathroom_length_m ?? "",
    has_ac: toBool(rt.has_ac),
    has_fan: toBool(rt.has_fan),
    bed_type: rt.bed_type || "",
    bed_size_cm: rt.bed_size_cm ?? "",
    is_active: toBool(rt.is_active),
    notes: rt.notes || "",
  };

  res.render("kost/roomTypes/form", {
    title: `Edit Room Type ${rt.code}`,
    mode: "edit",
    action: `/admin/kost/room-types/${id}`,
    errors: [],
    form,
  });
}

async function update(req, res) {
  const id = req.params.id;
  const errors = [];

  const form = {
    code: (req.body.code || "").trim(),
    name: (req.body.name || "").trim(),
    base_monthly_price: req.body.base_monthly_price,
    deposit_amount: req.body.deposit_amount ?? "",
    is_capsule: toBool(req.body.is_capsule),
    room_width_m: req.body.room_width_m,
    room_length_m: req.body.room_length_m,
    bathroom_location: req.body.bathroom_location || "OUTSIDE",
    bathroom_width_m: req.body.bathroom_width_m,
    bathroom_length_m: req.body.bathroom_length_m,
    has_ac: toBool(req.body.has_ac),
    has_fan: toBool(req.body.has_fan),
    bed_type: (req.body.bed_type || "").trim(),
    bed_size_cm: req.body.bed_size_cm,
    is_active: toBool(req.body.is_active),
    notes: (req.body.notes || "").trim(),
  };

  if (!form.code) errors.push("Code is required.");
  if (!form.name) errors.push("Name is required.");

  if (errors.length) {
    return res.status(400).render("kost/roomTypes/form", {
      title: `Edit Room Type ${form.code || ""}`,
      mode: "edit",
      action: `/admin/kost/room-types/${id}`,
      errors,
      form,
    });
  }

  const allowedBedTypes = new Set(["FOAM", "SPRINGBED"]);
  let bed_type = (form.bed_type || "").trim().toUpperCase();

  if (!bed_type) {
    errors.push("Bed type is required.");
  } else if (!allowedBedTypes.has(bed_type)) {
    errors.push("Bed type must be FOAM or SPRINGBED.");
  }

  const bath = normalizeBathroom(form, errors);

  if (errors.length) {
    return res.status(400).render("kost/roomTypes/form", {
      title: `Edit Room Type ${form.code || ""}`,
      mode: "edit",
      action: `/admin/kost/room-types/${id}`,
      errors,
      form: { ...form, ...bath },
    });
  }

  const payload = {
    code: form.code,
    name: form.name,
    base_monthly_price: parseNum(form.base_monthly_price) ?? 0,
    deposit_amount: parseNum(form.deposit_amount) ?? 0,
    is_capsule: toBool(form.is_capsule),
    room_width_m: parseNum(form.room_width_m) ?? null,
    room_length_m: parseNum(form.room_length_m) ?? null,
    bathroom_location: bath.bathroom_location,
    bathroom_width_m: bath.bathroom_width_m,
    bathroom_length_m: bath.bathroom_length_m,
    has_ac: toBool(form.has_ac),
    has_fan: toBool(form.has_fan),
    bed_type: bed_type,
    bed_size_cm: toIntOrNull(form.bed_size_cm),
    is_active: toBool(form.is_active),
    notes: form.notes || null,
  };

  const result = await repo.updateRoomType(id, payload);
  if (!result) return res.status(404).send("Room type not found");
  return res.redirect(`/admin/kost/room-types`);
}

async function toggleActive(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).send("Invalid room type id");
  }

  const rt = await repo.getRoomTypeById(id);
  if (!rt) {
    return res.status(404).send("Room type not found");
  }

  // If currently active, this toggle would deactivate it => enforce "not used by rooms"
  if (rt.is_active) {
    const cnt = await repo.countRoomsUsingRoomType(id);

    if (cnt > 0) {
      const msg = `Cannot deactivate room type ${rt.code} because it is used by ${cnt} room(s).`;

      if (req.session) {
        req.session.flash = { errors: [msg] };
      }

      return res.redirect("/admin/kost/room-types");
    }
  }

  await repo.toggleRoomTypeActive(id);
  return res.redirect("/admin/kost/room-types");
}

module.exports = { list, showNew, create, showEdit, update, toggleActive };
