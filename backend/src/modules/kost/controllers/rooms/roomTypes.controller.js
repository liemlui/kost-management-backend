// modules/kost/controllers/rooms/roomTypes.controller.js
const repo = require("../../repos/rooms/roomTypes.repo");

function parseNum(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function toBool(v) {
  return v === "on" || v === "true" || v === true;
}

async function list(req, res) {
  const roomTypes = await repo.listRoomTypes();
  res.render("kost/roomTypes/index", { title: "Room Types", roomTypes });
}

async function showNew(req, res) {
  res.render("kost/roomTypes/form", {
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
      bathroom_location: "",
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
    deposit_amount: req.body.deposit_amount,
    is_capsule: toBool(req.body.is_capsule),
    room_width_m: req.body.room_width_m,
    room_length_m: req.body.room_length_m,
    bathroom_location: req.body.bathroom_location || "",
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
      title: "New Room Type",
      mode: "new",
      action: "/admin/kost/room-types",
      errors,
      form,
    });
  }

  const payload = {
    code: form.code,
    name: form.name,
    base_monthly_price: parseNum(form.base_monthly_price) || 0,
    deposit_amount: parseNum(form.deposit_amount) || 0,
    is_capsule: form.is_capsule,
    room_width_m: parseNum(form.room_width_m),
    room_length_m: parseNum(form.room_length_m),
    bathroom_location: form.bathroom_location || null,
    bathroom_width_m: parseNum(form.bathroom_width_m),
    bathroom_length_m: parseNum(form.bathroom_length_m),
    has_ac: form.has_ac,
    has_fan: form.has_fan,
    bed_type: form.bed_type || null,
    bed_size_cm: parseNum(form.bed_size_cm),
    is_active: form.is_active,
    notes: form.notes || null,
  };

  const result = await repo.insertRoomType(payload);
  return res.redirect(`/admin/kost/room-types/${result.id}/edit`);
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
    is_capsule: !!rt.is_capsule,
    room_width_m: rt.room_width_m ?? "",
    room_length_m: rt.room_length_m ?? "",
    bathroom_location: rt.bathroom_location || "",
    bathroom_width_m: rt.bathroom_width_m ?? "",
    bathroom_length_m: rt.bathroom_length_m ?? "",
    has_ac: !!rt.has_ac,
    has_fan: !!rt.has_fan,
    bed_type: rt.bed_type || "",
    bed_size_cm: rt.bed_size_cm ?? "",
    is_active: !!rt.is_active,
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
    deposit_amount: req.body.deposit_amount,
    is_capsule: toBool(req.body.is_capsule),
    room_width_m: req.body.room_width_m,
    room_length_m: req.body.room_length_m,
    bathroom_location: req.body.bathroom_location || "",
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

  const payload = {
    code: form.code,
    name: form.name,
    base_monthly_price: parseNum(form.base_monthly_price) || 0,
    is_capsule: form.is_capsule,
    room_width_m: parseNum(form.room_width_m),
    room_length_m: parseNum(form.room_length_m),
    bathroom_location: form.bathroom_location || null,
    bathroom_width_m: parseNum(form.bathroom_width_m),
    bathroom_length_m: parseNum(form.bathroom_length_m),
    has_ac: form.has_ac,
    has_fan: form.has_fan,
    bed_type: form.bed_type || null,
    bed_size_cm: parseNum(form.bed_size_cm),
    is_active: form.is_active,
    notes: form.notes || null,
  };

  const result = await repo.updateRoomType(id, payload);
  if (!result) return res.status(404).send("Room type not found");
  return res.redirect(`/admin/kost/room-types/${id}/edit`);
}

module.exports = { list, showNew, create, showEdit, update };
