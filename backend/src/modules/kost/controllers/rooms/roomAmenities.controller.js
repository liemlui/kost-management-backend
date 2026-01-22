// modules/kost/controllers/rooms/roomAmenities.controller.js

const roomRepo = require("../../repos/rooms/room.repo");
const roomAmenityRepo = require("../../repos/rooms/roomAmenity.repo");

// helper kecil: validasi qty
function toQty(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.floor(n);
}

// (opsional) validasi condition - sesuaikan dengan CHECK/enum schema kamu
const ALLOWED_CONDITIONS = new Set(["NEW", "GOOD", "FAIR", "DAMAGED", "MISSING"]);

async function manageRoomAmenities(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const room = await roomRepo.getRoomById(roomId);
    if (!room) return res.status(404).send("Room not found");

    const roomAmenities = await roomAmenityRepo.listRoomAmenities(roomId);
    const picklist = await roomAmenityRepo.listActiveAmenitiesNotInRoom(roomId);

    res.render("kost/rooms/amenities", {
      title: `Manage Amenities — Room ${room.code}`,
      room,
      roomAmenities,
      picklist,
    });
  } catch (err) {
    next(err);
  }
}

async function addRoomAmenity(req, res, next) {
  try {
    const roomId = Number(req.params.id);

    // pastikan room ada (biar error FK tidak “misterius”)
    const room = await roomRepo.getRoomById(roomId);
    if (!room) return res.status(404).send("Room not found");

    const amenity_id = Number(req.body.amenity_id);
    const qty = toQty(req.body.qty);
    const conditionRaw = (req.body.condition || "").trim();
    const condition = conditionRaw ? conditionRaw : null;

    if (!amenity_id) {
      return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
    }
    if (condition && !ALLOWED_CONDITIONS.has(condition)) {
      return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
    }

    // insert (akan kena UNIQUE(room_id, amenity_id) kalau duplicate)
    await roomAmenityRepo.insertRoomAmenity(roomId, {
      amenity_id,
      qty,
      condition,
      notes: (req.body.notes || "").trim() || null,
    });

    return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
  } catch (err) {
    // duplicate mapping (unique violation) → redirect aja (tidak perlu crash)
    if (err && err.code === "23505") {
      return res.redirect(`/admin/kost/rooms/${req.params.id}/amenities`);
    }
    next(err);
  }
}

async function updateRoomAmenity(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const roomAmenityId = Number(req.params.roomAmenityId);

    const qty = toQty(req.body.qty);
    const conditionRaw = (req.body.condition || "").trim();
    const condition = conditionRaw ? conditionRaw : null;

    if (condition && !ALLOWED_CONDITIONS.has(condition)) {
      return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
    }

    const updated = await roomAmenityRepo.updateRoomAmenity(roomId, roomAmenityId, {
      qty,
      condition,
      notes: (req.body.notes || "").trim() || null,
    });

    // kalau tidak ketemu / bukan milik room itu
    if (!updated) return res.status(404).send("Room amenity not found");

    return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
  } catch (err) {
    next(err);
  }
}

async function deleteRoomAmenity(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const roomAmenityId = Number(req.params.roomAmenityId);

    const deleted = await roomAmenityRepo.deleteRoomAmenity(roomId, roomAmenityId);
    if (!deleted) return res.status(404).send("Room amenity not found");

    return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  manageRoomAmenities,
  addRoomAmenity,
  updateRoomAmenity,
  deleteRoomAmenity,
};
