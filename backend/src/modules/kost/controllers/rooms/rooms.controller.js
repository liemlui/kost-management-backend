// modules/kost/controllers/rooms/rooms.controller.js

const roomRepo = require("../../repos/rooms/room.repo");
const roomAmenityRepo = require("../../repos/rooms/roomAmenity.repo");
const roomTypesRepo = require("../../repos/rooms/roomTypes.repo");

const FLOOR_OPTIONS = [1, 2];
const ZONE_OPTIONS = ["", "FRONT", "MIDDLE", "BACK"]; // "" => null
const STATUS_OPTIONS = ["AVAILABLE", "MAINTENANCE", "INACTIVE"];

function normalizeRoomPayload(body) {
  const code = (body.code || "").trim();
  const room_type_id = body.room_type_id ? Number(body.room_type_id) : null;
  const floor = body.floor ? Number(body.floor) : null;

  const position_zone =
    body.position_zone && body.position_zone.trim() !== ""
      ? body.position_zone.trim()
      : null;

  const status = (body.status || "AVAILABLE").trim();
  const notes = body.notes && body.notes.trim() !== "" ? body.notes.trim() : null;

  return { code, room_type_id, floor, position_zone, status, notes };
}

function validateRoomPayload(p) {
  const errors = [];
  if (!p.code) errors.push("Code wajib diisi.");
  if (!p.room_type_id || Number.isNaN(p.room_type_id))
    errors.push("Room type wajib dipilih.");
  if (!p.floor || !FLOOR_OPTIONS.includes(p.floor))
    errors.push("Floor hanya boleh 1 atau 2.");
  if (p.position_zone && !["FRONT", "MIDDLE", "BACK"].includes(p.position_zone)) {
    errors.push("Position zone tidak valid.");
  }
  if (!STATUS_OPTIONS.includes(p.status)) errors.push("Status tidak valid.");
  return errors;
}

async function index(req, res, next) {
  try {
    const rooms = await roomRepo.listRooms(); // ✅ repo returns rows[]
    res.render("kost/rooms/index", {
      title: "Rooms",
      rooms,
    });
  } catch (err) {
    next(err);
  }
}

async function showNewForm(req, res, next) {
  try {
    const roomTypes = await roomRepo.listRoomTypes(); // ✅ rows[]
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
    const payload = normalizeRoomPayload(req.body);
    const errors = validateRoomPayload(payload);

    const roomTypes = await roomRepo.listRoomTypes();

    if (errors.length) {
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

    const inserted = await roomRepo.insertRoom(payload); // ✅ { id }
    const newId = inserted?.id;

    if (!newId) {
      // safety net if SQL missing RETURNING
      const e = new Error("Insert room succeeded but no id returned. Check SQL RETURNING.");
      e.status = 500;
      throw e;
    }

    return res.redirect(`/admin/kost/rooms/${newId}`);
  } catch (err) {
    if (err.code === "23505") {
      try {
        const roomTypes = await roomRepo.listRoomTypes();
        return res.status(400).render("kost/rooms/new", {
          title: "New Room",
          roomTypes,
          floorOptions: FLOOR_OPTIONS,
          zoneOptions: ZONE_OPTIONS,
          statusOptions: STATUS_OPTIONS,
          form: req.body,
          errors: ["Room code sudah dipakai (harus unique)."],
        });
      } catch (e) {
        return next(err);
      }
    }
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const room = await roomRepo.getRoomById(id); // ✅ object | null
    if (!room) return res.status(404).send("Room not found");

    const roomAmenities = await roomAmenityRepo.listRoomAmenities(id); // ✅ ADD
    const roomTypes = await roomTypesRepo.listRoomTypes(); // rows[]

    res.render("kost/rooms/detail", {
      title: `Room ${room.code}`,
      room,
      roomAmenities,
        roomTypes,
        query: req.query,
    });
  } catch (err) {
    next(err);
  }
}

async function showEditForm(req, res, next) {
  try {
    const id = Number(req.params.id);

    const [roomTypes, room, roomAmenities] = await Promise.all([
      roomRepo.listRoomTypes(),
      roomRepo.getRoomById(id),
      roomAmenityRepo.listRoomAmenities(id),
    ]);

    if (!room) return res.status(404).send("Room not found");

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
    const id = Number(req.params.id);
    const payload = normalizeRoomPayload(req.body);
    const errors = validateRoomPayload(payload);

    const roomTypes = await roomRepo.listRoomTypes();

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

    // repo kamu sekarang: updateRoom(payload) yang expects payload.id
    // ✅ kita pakai format yang kamu punya sekarang
    await roomRepo.updateRoom({ id, ...payload });

    return res.redirect(`/admin/kost/rooms/${id}`);
  } catch (err) {
    if (err.code === "23505") {
      const roomTypes = await roomRepo.listRoomTypes();
      return res.status(400).render("kost/rooms/edit", {
        title: `Edit Room`,
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: req.body,
        roomId: Number(req.params.id),
        errors: ["Room code sudah dipakai (harus unique)."],
      });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    await roomRepo.deleteRoom(id);
    return res.redirect("/admin/kost/rooms");
  } catch (err) {
    if (err.code === "23503") {
      return res
        .status(409)
        .send(
          "Tidak bisa delete room karena sudah dipakai oleh data lain (mis. stays). Solusi: set status menjadi INACTIVE."
        );
    }
    next(err);
  }
}

async function block(req, res, next) {
  try {
    const id = Number(req.params.id);
    await roomRepo.blockRoom(id);
    return res.redirect(`/admin/kost/rooms/${id}`);
  } catch (err) {
    next(err);
  }
}

async function unblock(req, res, next) {
  try {
    const id = Number(req.params.id);
    await roomRepo.unblockRoom(id);
    return res.redirect(`/admin/kost/rooms/${id}`);
  } catch (err) {
    next(err);
  }
}

async function changeRoomType(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const roomTypeId = Number(req.body.room_type_id);

    if (!roomTypeId) return res.status(400).send("room_type_id is required");

    await roomRepo.updateRoomType(roomId, roomTypeId);

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
