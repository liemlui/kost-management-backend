import { Body, Controller, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { RoomsRepo, type RoomPayload, type RoomStatus } from "./rooms.repo";
import { RoomTypesRepo } from "./roomTypes.repo";
import { RoomAmenitiesRepo } from "./roomAmenities.repo";
import { optionalInt, optionalString } from "../../../shared/parsers";
import { logger } from "../../../config/logger";

const FLOOR_OPTIONS = [1, 2] as const;
const ZONE_OPTIONS = ["", "FRONT", "MIDDLE", "BACK"] as const;
const STATUS_OPTIONS = ["AVAILABLE", "MAINTENANCE", "INACTIVE"] as const;

function toIntOrNull(v: unknown): number | null {
  return optionalInt(v, { min: 1 });
}

function toNullIfEmpty(v: unknown): string | null {
  return optionalString(v);
}

function toSelectIntOrNull(v: unknown): number | null {
  // select often sends "" when not selected
  if (v === "" || v === null || v === undefined) return null;
  return optionalInt(v, { min: 1 });
}

function normalizeRoomPayload(body: any) {
  const code = String(body.code ?? "").trim();
  const room_type_id = toSelectIntOrNull(body.room_type_id);
  const floor = toIntOrNull(body.floor);
  const position_zone = toNullIfEmpty(body.position_zone);
  const status = String(body.status ?? "AVAILABLE").trim() as RoomStatus;
  const notes = toNullIfEmpty(body.notes);
  return { code, room_type_id, floor, position_zone, status, notes };
}

function validateRoomPayload(p: ReturnType<typeof normalizeRoomPayload>): string[] {
  const errors: string[] = [];
  if (!p.code) errors.push("Code wajib diisi.");
  if (!p.room_type_id || Number.isNaN(p.room_type_id)) errors.push("Room type wajib dipilih.");
  if (!p.floor || !(FLOOR_OPTIONS as readonly number[]).includes(p.floor)) errors.push("Floor hanya boleh 1 atau 2.");
  if (p.position_zone && !(ZONE_OPTIONS as readonly string[]).includes(p.position_zone)) errors.push("Position zone tidak valid.");
  if (!(STATUS_OPTIONS as readonly string[]).includes(p.status)) errors.push("Status tidak valid.");
  return errors;
}

function parseIdOr400(req: Request, res: Response): number | null {
  const id = toIntOrNull(req.params.id);
  if (!id) {
    res.status(400).send("Invalid id");
    return null;
  }
  return id;
}

// minimal flash helpers (compatible with legacy flash.js style)
function setFlash(req: any, type: "success" | "error" | "info", message: string) {
  req.session = req.session ?? {};
  req.session.flash = { type, message };
}
function consumeFlash(req: any) {
  const f = req.session?.flash ?? null;
  if (req.session) req.session.flash = null;
  return f;
}

@Controller("admin/kost/rooms")
export class RoomsController {
  constructor(
    private readonly roomsRepo: RoomsRepo,
    private readonly roomTypesRepo: RoomTypesRepo,
    private readonly roomAmenitiesRepo: RoomAmenitiesRepo,
  ) {}

  @Get("/")
  async index(@Req() req: Request, @Res() res: Response, @Query("room_type_id") roomTypeIdQ?: string) {
    res.locals.flash = consumeFlash(req as any);

    const roomTypeId = toIntOrNull(roomTypeIdQ);
    const [rooms, roomTypes] = await Promise.all([
      this.roomsRepo.listRooms(roomTypeId),
      this.roomTypesRepo.listActiveRoomTypes(),
    ]);

    return res.render("kost/rooms/index", {
      title: "Rooms",
      rooms,
      roomTypes,
      filters: { room_type_id: roomTypeId },
    });
  }

  @Get("/new")
  async showNew(@Req() req: Request, @Res() res: Response) {
    res.locals.flash = consumeFlash(req as any);

    const roomTypes = await this.roomTypesRepo.listActiveRoomTypes();
    return res.render("kost/rooms/new", {
      title: "New Room",
      roomTypes,
      floorOptions: FLOOR_OPTIONS,
      zoneOptions: ZONE_OPTIONS,
      statusOptions: STATUS_OPTIONS,
      form: { code: "", room_type_id: "", floor: 1, position_zone: "", status: "AVAILABLE", notes: "" },
      errors: [],
    });
  }

  @Post("/")
  async create(@Req() req: any, @Res() res: Response, @Body() body: any) {
    logger.info("rooms.create.start", { sessionId: req.sessionID ? String(req.sessionID).slice(0, 10) + "..." : null });

    const payload0 = normalizeRoomPayload(body);
    const errors = validateRoomPayload(payload0);
    const roomTypes = await this.roomTypesRepo.listActiveRoomTypes();

    if (errors.length) {
      setFlash(req, "error", errors.join(" "));
      return res.status(400).render("kost/rooms/new", {
        title: "New Room",
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload0, room_type_id: body.room_type_id ?? "" },
        errors,
      });
    }

    const payload: RoomPayload = {
      code: payload0.code,
      room_type_id: payload0.room_type_id!,
      floor: payload0.floor as 1 | 2,
      position_zone: (payload0.position_zone as any) ?? null,
      status: payload0.status,
      notes: payload0.notes,
    };

    try {
      const inserted = await this.roomsRepo.insertRoom(payload);
      const newId = inserted?.id;
      if (!newId) throw Object.assign(new Error("Insert room succeeded but no id returned."), { status: 500 });

      logger.info("rooms.create.success", { roomId: newId, code: payload.code });
      setFlash(req, "success", `Room "${payload.code}" berhasil dibuat`);
      return res.redirect(`/admin/kost/rooms/${newId}`);
    } catch (err: any) {
      logger.error("rooms.create.error", { error: err?.message, code: err?.code });

      if (err?.code === "23505") {
        const msg = "Room code sudah dipakai (harus unique).";
        setFlash(req, "error", msg);
        return res.status(400).render("kost/rooms/new", {
          title: "New Room",
          roomTypes,
          floorOptions: FLOOR_OPTIONS,
          zoneOptions: ZONE_OPTIONS,
          statusOptions: STATUS_OPTIONS,
          form: body,
          errors: [msg],
        });
      }
      throw err;
    }
  }

  @Get("/:id")
  async detail(@Req() req: any, @Res() res: Response, @Param("id") _id: string, @Query() query: any) {
    res.locals.flash = consumeFlash(req);

    const id = parseIdOr400(req, res);
    if (!id) return;

    const room = await this.roomsRepo.getRoomById(id);
    if (!room) {
      setFlash(req, "error", "Room tidak ditemukan");
      return res.redirect("/admin/kost/rooms");
    }

    const [roomAmenities, roomTypes] = await Promise.all([
      this.roomAmenitiesRepo.listRoomAmenities(id),
      this.roomTypesRepo.listRoomTypes(),
    ]);

    const hasAC = !!room.has_ac || roomAmenities.some((a: any) => a.amenity_code === "AC");
    const hasFAN = !!room.has_fan || roomAmenities.some((a: any) => a.amenity_code === "FAN");

    return res.render("kost/rooms/detail", {
      title: `Room ${room.code}`,
      room,
      roomAmenities,
      roomTypes,
      hasAC,
      hasFAN,
      query,
    });
  }

  @Get("/:id/edit")
  async showEdit(@Req() req: any, @Res() res: Response) {
    res.locals.flash = consumeFlash(req);

    const id = parseIdOr400(req, res);
    if (!id) return;

    const [roomTypes, room, roomAmenities] = await Promise.all([
      this.roomTypesRepo.listActiveRoomTypes(),
      this.roomsRepo.getRoomById(id),
      this.roomAmenitiesRepo.listRoomAmenities(id),
    ]);

    if (!room) {
      setFlash(req, "error", "Room tidak ditemukan");
      return res.redirect("/admin/kost/rooms");
    }

    return res.render("kost/rooms/edit", {
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
  }

  @Post("/:id")
  async update(@Req() req: any, @Res() res: Response, @Body() body: any) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    const payload0 = normalizeRoomPayload(body);
    const errors = validateRoomPayload(payload0);
    const roomTypes = await this.roomTypesRepo.listActiveRoomTypes();
    const roomAmenities = await this.roomAmenitiesRepo.listRoomAmenities(id);

    if (errors.length) {
      return res.status(400).render("kost/rooms/edit", {
        title: `Edit Room ${payload0.code || id}`,
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload0, room_type_id: body.room_type_id ?? "" },
        roomId: id,
        roomAmenities,
        errors,
      });
    }

    const payload: RoomPayload = {
      code: payload0.code,
      room_type_id: payload0.room_type_id!,
      floor: payload0.floor as 1 | 2,
      position_zone: (payload0.position_zone as any) ?? null,
      status: payload0.status,
      notes: payload0.notes,
    };

    try {
      await this.roomsRepo.updateRoom(id, payload);
      setFlash(req, "success", "Room berhasil diupdate");
      return res.redirect(`/admin/kost/rooms/${id}`);
    } catch (err: any) {
      if (err?.code === "23505") {
        const msg = "Room code sudah dipakai (harus unique).";
        return res.status(400).render("kost/rooms/edit", {
          title: "Edit Room",
          roomTypes,
          floorOptions: FLOOR_OPTIONS,
          zoneOptions: ZONE_OPTIONS,
          statusOptions: STATUS_OPTIONS,
          form: body,
          roomId: id,
          roomAmenities,
          errors: [msg],
        });
      }
      throw err;
    }
  }

  @Post("/:id/delete")
  async remove(@Req() req: any, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    try {
      await this.roomsRepo.setInactive(id);
      setFlash(req, "success", "Room di-INACTIVE-kan");
      return res.redirect("/admin/kost/rooms");
    } catch (err: any) {
      if (err?.code === "23503") {
        setFlash(req, "error", "Tidak bisa menghapus room yang sedang dipakai");
        return res.status(409).send(
          "Tidak bisa delete room karena sudah dipakai oleh data lain (mis. stays). Solusi: set status menjadi INACTIVE.",
        );
      }
      throw err;
    }
  }

  @Post("/:id/block")
  async block(@Req() req: any, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;
    await this.roomsRepo.setMaintenance(id);
    setFlash(req, "success", "Room diblokir (status MAINTENANCE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/unblock")
  async unblock(@Req() req: any, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;
    await this.roomsRepo.setAvailable(id);
    setFlash(req, "success", "Room di-unblokir (status AVAILABLE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/change-type")
  async changeRoomType(@Req() req: any, @Res() res: Response, @Body() body: any) {
    const roomId = parseIdOr400(req, res);
    if (!roomId) return;

    const roomTypeId = toSelectIntOrNull(body.room_type_id);
    if (!roomTypeId) {
      setFlash(req, "error", "room_type_id wajib dipilih");
      return res.redirect(`/admin/kost/rooms/${roomId}`);
    }

    await this.roomsRepo.updateRoomType(roomId, roomTypeId);
    setFlash(req, "success", "Tipe kamar berhasil diubah");
    return res.redirect(`/admin/kost/rooms/${roomId}?type_changed=1`);
  }
}
