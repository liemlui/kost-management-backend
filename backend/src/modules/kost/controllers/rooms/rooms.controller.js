// modules/kost/controllers/rooms/rooms.controller.js

const roomRepo = require("../../repos/rooms/room.repo");
const roomAmenityRepo = require("../../repos/rooms/roomAmenity.repo");
const roomTypesRepo = require("../../repos/rooms/roomTypes.repo");
const {
  toIntOrNull,
  toNullIfEmpty,
  toSelectIntOrNull,
} = require("../../../../shared/parsers");
const { setFlash, setFlashErrors } = require("../../../../shared/flash");
const logger = require("../../../../config/logger");

const FLOOR_OPTIONS = [1, 2];
const ZONE_OPTIONS = ["", "FRONT", "MIDDLE", "BACK"]; // "" => null
const STATUS_OPTIONS = ["AVAILABLE", "MAINTENANCE", "INACTIVE"];

function normalizeRoomPayload(body) {
  const code = (body.code || "").trim();
  const room_type_id = toSelectIntOrNull(body.room_type_id);
  const floor = toIntOrNull(body.floor);
  const position_zone = toNullIfEmpty(body.position_zone);
  const status = (body.status || "AVAILABLE").trim();
  const notes = toNullIfEmpty(body.notes);

  return { code, room_type_id, floor, position_zone, status, notes };
}

function validateRoomPayload(p) {
  const errors = [];
  if (!p.code) errors.push("Code wajib diisi.");
  if (!p.room_type_id || Number.isNaN(p.room_type_id))
    errors.push("Room type wajib dipilih.");
  if (!p.floor || !FLOOR_OPTIONS.includes(p.floor))
    errors.push("Floor hanya boleh 1 atau 2.");

  if (p.position_zone && !ZONE_OPTIONS.includes(p.position_zone)) {
    errors.push("Position zone tidak valid.");
  }

  if (!STATUS_OPTIONS.includes(p.status)) errors.push("Status tidak valid.");
  return errors;
}

function parseIdOr400(req, res) {
  const id = toIntOrNull(req.params.id);
  if (!id) {
    res.status(400).send("Invalid id");
    return null;
  }
  return id;
}

async function index(req, res, next) {
  try {
    const roomTypeId = toIntOrNull(req.query.room_type_id);

    const [rooms, roomTypes] = await Promise.all([
      roomRepo.listRooms(roomTypeId),
      roomTypesRepo.listActiveRoomTypes(),
    ]);

    res.render("kost/rooms/index", {
      title: "Rooms",
      rooms,
      roomTypes,
      filters: { room_type_id: roomTypeId },
    });
  } catch (err) {
    next(err);
  }
}

async function showNewForm(req, res, next) {
  try {
    const roomTypes = await roomTypesRepo.listActiveRoomTypes();
    res.render("kost/rooms/new", {
      title: "New Room",
      roomTypes,
      floorOptions: FLOOR_OPTIONS,
      zoneOptions: ZONE_OPTIONS,
      statusOptions: STATUS_OPTIONS,
      form: {
        code: "",
        room_type_id: "",
        floor: 1,
        position_zone: "",
        status: "AVAILABLE",
        notes: "",
      },
      errors: [],
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    logger.info("rooms.create.start", {
      sessionId: req.sessionID?.substring(0, 10) + "...",
    });

    const payload = normalizeRoomPayload(req.body);
    const errors = validateRoomPayload(payload);
    const roomTypes = await roomTypesRepo.listActiveRoomTypes();

    if (errors.length) {
      logger.info("rooms.create.validation_errors", { errors });
      await setFlashErrors(req, errors);
      return res.status(400).render("kost/rooms/new", {
        title: "New Room",
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload, room_type_id: req.body.room_type_id ?? "" },
        errors,
      });
    }

    const inserted = await roomRepo.insertRoom(payload);
    const newId = inserted?.id;

    if (!newId) {
      const e = new Error("Insert room succeeded but no id returned.");
      e.status = 500;
      throw e;
    }

    logger.info("rooms.create.success", { roomId: newId, code: payload.code });
    await setFlash(req, "success", `Room "${payload.code}" berhasil dibuat`);
    return res.redirect(`/admin/kost/rooms/${newId}`);
  } catch (err) {
    logger.error("rooms.create.error", {
      error: err.message,
      code: err.code,
      sessionId: req.sessionID?.substring(0, 10) + "...",
    });

    if (err.code === "23505") {
      const roomTypes = await roomTypesRepo.listActiveRoomTypes();
      const msg = "Room code sudah dipakai (harus unique).";
      await setFlashErrors(req, msg);

      return res.status(400).render("kost/rooms/new", {
        title: "New Room",
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: req.body,
        errors: [msg],
      });
    }

    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const id = parseIdOr400(req, res);
    if (!id) return;

    const room = await roomRepo.getRoomById(id);
    if (!room) {
      await setFlash(req, "error", "Room tidak ditemukan");
      return res.redirect("/admin/kost/rooms");
    }

    const [roomAmenities, roomTypes] = await Promise.all([
      roomAmenityRepo.listRoomAmenities(id),
      roomTypesRepo.listRoomTypes(),
    ]);

    // ✅ super clean: compute in controller (SSOT display data)
    const hasAC =
      !!room.has_ac || (Array.isArray(roomAmenities) && roomAmenities.some(a => a.amenity_code === "AC"));

    const hasFAN =
      !!room.has_fan || (Array.isArray(roomAmenities) && roomAmenities.some(a => a.amenity_code === "FAN"));

    res.render("kost/rooms/detail", {
      title: `Room ${room.code}`,
      room,
      roomAmenities,
      roomTypes,
      hasAC,
      hasFAN,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
}


async function showEditForm(req, res, next) {
  try {
    const id = parseIdOr400(req, res);
    if (!id) return;

    const [roomTypes, room, roomAmenities] = await Promise.all([
      roomTypesRepo.listActiveRoomTypes(),
      roomRepo.getRoomById(id),
      roomAmenityRepo.listRoomAmenities(id),
    ]);

    if (!room) {
      await setFlash(req, "error", "Room tidak ditemukan");
      return res.redirect("/admin/kost/rooms");
    }

    res.render("kost/rooms/edit", {
      title: `Edit Room ${room.code}`,
      roomTypes,
      floorOptions: FLOOR_OPTIONS,
      zoneOptions: ZONE_OPTIONS,
      statusOptions: STATUS_OPTIONS,
      form: {
        code: room.code,
        room_type_id: room.room_type_id,
        floor: room.floor,
        position_zone: room.position_zone ?? "",
        status: room.status,
        notes: room.notes ?? "",
      },
      roomId: id,
      roomAmenities,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = parseIdOr400(req, res);
    if (!id) return;

    const payload = normalizeRoomPayload(req.body);
    const errors = validateRoomPayload(payload);
    const roomTypes = await roomTypesRepo.listActiveRoomTypes();

    if (errors.length) {
      return res.status(400).render("kost/rooms/edit", {
        title: `Edit Room ${payload.code || id}`,
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload, room_type_id: req.body.room_type_id ?? "" },
        roomId: id,
        errors,
      });
    }

    await roomRepo.updateRoom({ id, ...payload });
    await setFlash(req, "success", "Room berhasil diupdate");
    return res.redirect(`/admin/kost/rooms/${id}`);
  } catch (err) {
    if (err.code === "23505") {
      const roomTypes = await roomTypesRepo.listActiveRoomTypes();
      const msg = "Room code sudah dipakai (harus unique).";

      return res.status(400).render("kost/rooms/edit", {
        title: `Edit Room`,
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: req.body,
        roomId: toIntOrNull(req.params.id),
        errors: [msg],
      });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = parseIdOr400(req, res);
    if (!id) return;

    await roomRepo.deleteRoom(id);
    await setFlash(req, "success", "Room di-INACTIVE-kan");
    return res.redirect("/admin/kost/rooms");
  } catch (err) {
    if (err.code === "23503") {
      await setFlash(req, "error", "Tidak bisa menghapus room yang sedang dipakai");
      return res.status(409).send(
        "Tidak bisa delete room karena sudah dipakai oleh data lain (mis. stays). Solusi: set status menjadi INACTIVE."
      );
    }
    next(err);
  }
}

async function block(req, res, next) {
  try {
    const id = parseIdOr400(req, res);
    if (!id) return;

    await roomRepo.blockRoom(id);
    await setFlash(req, "success", "Room diblokir (status MAINTENANCE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  } catch (err) {
    next(err);
  }
}

async function unblock(req, res, next) {
  try {
    const id = parseIdOr400(req, res);
    if (!id) return;

    await roomRepo.unblockRoom(id);
    await setFlash(req, "success", "Room di-unblokir (status AVAILABLE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  } catch (err) {
    next(err);
  }
}

async function changeRoomType(req, res, next) {
  try {
    const roomId = parseIdOr400(req, res);
    if (!roomId) return;

    const roomTypeId = toSelectIntOrNull(req.body.room_type_id);
    if (!roomTypeId) {
      await setFlash(req, "error", "room_type_id wajib dipilih");
      return res.redirect(`/admin/kost/rooms/${roomId}`);
    }

    await roomRepo.updateRoomType(roomId, roomTypeId);
    await setFlash(req, "success", "Tipe kamar berhasil diubah");
    return res.redirect(`/admin/kost/rooms/${roomId}?type_changed=1`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  index,
  showNewForm,
  create,
  detail,
  showEditForm,
  update,
  remove,
  block,
  unblock,
  changeRoomType,
};
