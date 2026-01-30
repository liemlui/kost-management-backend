// modules/kost/controllers/rooms/roomAmenities.controller.js

const roomRepo = require("../../repos/rooms/room.repo");
const roomAmenityRepo = require("../../repos/rooms/roomAmenity.repo");
const { toIntOrNull, toNullIfEmpty } = require("../../../../shared/parsers");

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
    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).send("Invalid room id");
    }

    const room = await roomRepo.getRoomById(roomId);
    if (!room) return res.status(404).send("Room not found");

    const roomAmenities = await roomAmenityRepo.listRoomAmenities(roomId);
    const picklist = await roomAmenityRepo.listActiveAmenitiesNotInRoom(roomId);

    return res.render("kost/rooms/amenities", {
      title: `Manage Amenities — Room ${room.code}`,
      room,
      roomAmenities,
      picklist,
      allowedConditions: Array.from(ALLOWED_CONDITIONS),
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

    const amenity_id = toIntOrNull(req.body.amenity_id);
    const qty = toQty(req.body.qty);
    const conditionRaw = (req.body.condition || "").trim();
    const condition = conditionRaw ? conditionRaw.toUpperCase() : null;

    if (!Number.isInteger(amenity_id) || amenity_id <= 0) {
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
      notes: toNullIfEmpty(req.body.notes),
    });

    return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
  } catch (err) {
    next(err);
  }
}

async function updateRoomAmenity(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const roomAmenityId = toIntOrNull(req.params.roomAmenityId);

    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).send("Invalid room id");
    }
    if (!Number.isInteger(roomAmenityId) || roomAmenityId <= 0) {
      return res.status(400).send("Invalid roomAmenityId");
    }

    const qty = toQty(req.body.qty);
    const conditionRaw = (req.body.condition || "").trim();
    const condition = conditionRaw ? conditionRaw.toUpperCase() : null;

    if (condition && !ALLOWED_CONDITIONS.has(condition)) {
      return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
    }

    const updated = await roomAmenityRepo.updateRoomAmenity(roomId, roomAmenityId, {
      qty,
      condition,
      notes: toNullIfEmpty(req.body.notes),
    });

    if (!updated) return res.status(404).send("Room amenity not found");
    return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
  } catch (err) {
    next(err);
  }
}


async function deleteRoomAmenity(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const roomAmenityId = toIntOrNull(req.params.roomAmenityId);

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
