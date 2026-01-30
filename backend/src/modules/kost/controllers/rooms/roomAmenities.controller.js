// modules/kost/controllers/rooms/roomAmenities.controller.js

const roomRepo = require("../../repos/rooms/room.repo");
const roomAmenityRepo = require("../../repos/rooms/roomAmenity.repo");
const { toIntOrNull, toNullIfEmpty } = require("../../../../shared/parsers");
const { setFlash } = require("../../../../shared/flash");

// helper kecil: validasi qty
function toQty(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.floor(n);
}

const ALLOWED_CONDITIONS = new Set(["NEW", "GOOD", "FAIR", "DAMAGED", "MISSING"]);

function parseRoomIdOr400(req, res) {
  const roomId = toIntOrNull(req.params.id);
  if (!roomId) {
    res.status(400).send("Invalid room id");
    return null;
  }
  return roomId;
}

async function manageRoomAmenities(req, res, next) {
  try {
    const roomId = parseRoomIdOr400(req, res);
    if (!roomId) return;

    const room = await roomRepo.getRoomById(roomId);
    if (!room) return res.status(404).send("Room not found");

    const [roomAmenities, picklist] = await Promise.all([
      roomAmenityRepo.listRoomAmenities(roomId),
      roomAmenityRepo.listActiveAmenitiesNotInRoom(roomId),
    ]);

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
    const roomId = parseRoomIdOr400(req, res);
    if (!roomId) return;

    const room = await roomRepo.getRoomById(roomId);
    if (!room) return res.status(404).send("Room not found");

    const amenity_id = toIntOrNull(req.body.amenity_id);
    const qty = toQty(req.body.qty);
    const conditionRaw = (req.body.condition || "").trim();
    const condition = conditionRaw ? conditionRaw.toUpperCase() : null;

    if (!amenity_id) {
      await setFlash(req, "error", "Amenity wajib dipilih");
      return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
    }

    if (condition && !ALLOWED_CONDITIONS.has(condition)) {
      await setFlash(req, "error", "Condition tidak valid");
      return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
    }

    await roomAmenityRepo.insertRoomAmenity(roomId, {
      amenity_id,
      qty,
      condition,
      notes: toNullIfEmpty(req.body.notes),
    });

    await setFlash(req, "success", "Amenity berhasil ditambahkan");
    return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
  } catch (err) {
    next(err);
  }
}

async function updateRoomAmenity(req, res, next) {
  try {
    const roomId = parseRoomIdOr400(req, res);
    if (!roomId) return;

    const roomAmenityId = toIntOrNull(req.params.roomAmenityId);
    if (!roomAmenityId) return res.status(400).send("Invalid roomAmenityId");

    const qty = toQty(req.body.qty);
    const conditionRaw = (req.body.condition || "").trim();
    const condition = conditionRaw ? conditionRaw.toUpperCase() : null;

    if (condition && !ALLOWED_CONDITIONS.has(condition)) {
      await setFlash(req, "error", "Condition tidak valid");
      return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
    }

    const updated = await roomAmenityRepo.updateRoomAmenity(roomId, roomAmenityId, {
      qty,
      condition,
      notes: toNullIfEmpty(req.body.notes),
    });

    if (!updated) return res.status(404).send("Room amenity not found");

    await setFlash(req, "success", "Amenity berhasil diupdate");
    return res.redirect(`/admin/kost/rooms/${roomId}/amenities`);
  } catch (err) {
    next(err);
  }
}

async function deleteRoomAmenity(req, res, next) {
  try {
    const roomId = parseRoomIdOr400(req, res);
    if (!roomId) return;

    const roomAmenityId = toIntOrNull(req.params.roomAmenityId);
    if (!roomAmenityId) return res.status(400).send("Invalid roomAmenityId");

    const deleted = await roomAmenityRepo.deleteRoomAmenity(roomId, roomAmenityId);
    if (!deleted) return res.status(404).send("Room amenity not found");

    await setFlash(req, "success", "Amenity berhasil dihapus");
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
