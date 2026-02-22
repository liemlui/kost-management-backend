import { Body, Controller, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { RoomsRepo, type RoomPayload, type RoomStatus } from "./rooms.repo";
import { RoomTypesRepo } from "./roomTypes.repo";
import { RoomAmenitiesRepo } from "./roomAmenities.repo";
import { optionalInt, optionalSelectInt } from "../../../shared/parsers";
import { logger } from "../../../config/logger";
import { getFlash, setFlash } from "../../../shared/flash";
import {
  fmtDateISO,
  fmtIDR,
  roomStatusBadgeClass,
  amenityConditionBadgeClass,
} from "../../../shared/viewHelpers";

const FLOOR_OPTIONS = [1, 2] as const;
const ZONE_OPTIONS = ["", "FRONT", "MIDDLE", "BACK"] as const;
const STATUS_OPTIONS = ["AVAILABLE", "MAINTENANCE", "INACTIVE"] as const;

type ReqWithSession = Request & {
  sessionID?: string;
  session?: { flash?: unknown };
};

type RoomFormShape = {
  code: string;
  room_type_id: number | null;
  floor: number | null;
  position_zone: string | null; // null or FRONT/MIDDLE/BACK
  status: RoomStatus;
  notes: string | null;
};

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function toNullIfEmptyString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function normalizeRoomPayload(body: unknown): RoomFormShape {
  const b = asObj(body);

  const code = String(b.code ?? "").trim();
  const room_type_id = optionalSelectInt(b.room_type_id, { min: 1 });
  const floor = optionalInt(b.floor, { min: 1 });
  const position_zone = toNullIfEmptyString(b.position_zone); // ✅ parity with legacy toNullIfEmpty
  const status = String(b.status ?? "AVAILABLE").trim() as RoomStatus;
  const notes = toNullIfEmptyString(b.notes);

  return { code, room_type_id, floor, position_zone, status, notes };
}

function validateRoomPayload(p: RoomFormShape): string[] {
  const errors: string[] = [];
  if (!p.code) errors.push("Code wajib diisi.");
  if (!p.room_type_id || Number.isNaN(p.room_type_id)) errors.push("Room type wajib dipilih.");
  if (!p.floor || !(FLOOR_OPTIONS as readonly number[]).includes(p.floor)) errors.push("Floor hanya boleh 1 atau 2.");

  if (p.position_zone && !(ZONE_OPTIONS as readonly string[]).includes(p.position_zone)) {
    errors.push("Position zone tidak valid.");
  }

  if (!(STATUS_OPTIONS as readonly string[]).includes(p.status)) errors.push("Status tidak valid.");
  return errors;
}

function parseIdOr400(req: Request, res: Response): number | null {
  const id = optionalInt(req.params?.id, { min: 1 });
  if (!id) {
    res.status(400).send("Invalid id");
    return null;
  }
  return id;
}

function getErrCode(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  return typeof e.code === "string" ? e.code : null;
}

function getErrMessage(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  return typeof e.message === "string" ? e.message : null;
}

@Controller("admin/kost/rooms")
export class RoomsController {
  constructor(
    private readonly roomsRepo: RoomsRepo,
    private readonly roomTypesRepo: RoomTypesRepo,
    private readonly roomAmenitiesRepo: RoomAmenitiesRepo,
  ) {}

  @Get("/")
  async index(
    @Req() req: ReqWithSession,
    @Res() res: Response,
    @Query("room_type_id") roomTypeIdQ?: string,
  ) {
    res.locals.flash = getFlash(req);

    const roomTypeId = optionalInt(roomTypeIdQ, { min: 1 });

    const [rooms, roomTypes] = await Promise.all([
      this.roomsRepo.listRooms(roomTypeId),
      this.roomTypesRepo.listActiveRoomTypes(),
    ]);

    const roomsVM = (rooms || []).map((row) => {
      const r = asObj(row);
      const statusText = String(r.status ?? "").toUpperCase();
      return {
        ...r,
        status_text: statusText,
        status_badge_class: roomStatusBadgeClass(statusText),
        base_monthly_price_text: fmtIDR(r.base_monthly_price),
        deposit_amount_text: fmtIDR(r.deposit_amount),
        created_at_text: fmtDateISO(r.created_at),
        updated_at_text: fmtDateISO(r.updated_at),
      };
    });

    return res.render("kost/rooms/index", {
      title: "Rooms",
      rooms: roomsVM,
      roomTypes,
      filters: { room_type_id: roomTypeId },
    });
  }

  @Get("/new")
  async showNew(@Req() req: ReqWithSession, @Res() res: Response) {
    res.locals.flash = getFlash(req);

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
  async create(@Req() req: ReqWithSession, @Res() res: Response, @Body() body: unknown) {
    logger.info("rooms.create.start", {
      sessionId: req.sessionID ? String(req.sessionID).slice(0, 10) + "..." : null,
    });

    const payload0 = normalizeRoomPayload(body);
    const errors = validateRoomPayload(payload0);
    const roomTypes = await this.roomTypesRepo.listActiveRoomTypes();

    // legacy: setFlashErrors + render
    if (errors.length) {
      await setFlash(req, "error", errors.join(" "), payload0 as unknown);
      const b = asObj(body);

      return res.status(400).render("kost/rooms/new", {
        title: "New Room",
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload0, room_type_id: (b.room_type_id ?? "") as unknown },
        errors,
      });
    }

    const payload: RoomPayload = {
      code: payload0.code,
      room_type_id: payload0.room_type_id!,
      floor: payload0.floor as 1 | 2,
      position_zone: payload0.position_zone,
      status: payload0.status,
      notes: payload0.notes,
    };

    try {
      const inserted = await this.roomsRepo.insertRoom(payload);
      const newId = inserted?.id;

      if (!newId) {
        const e = new Error("Insert room succeeded but no id returned.");
        (e as unknown as Record<string, unknown>).status = 500;
        throw e;
      }

      logger.info("rooms.create.success", { roomId: newId, code: payload.code });
      await setFlash(req, "success", `Room "${payload.code}" berhasil dibuat`);
      return res.redirect(`/admin/kost/rooms/${newId}`);
    } catch (err: unknown) {
      logger.error("rooms.create.error", {
        error: getErrMessage(err),
        code: getErrCode(err),
        sessionId: req.sessionID ? String(req.sessionID).slice(0, 10) + "..." : null,
      });

      if (getErrCode(err) === "23505") {
        const msg = "Room code sudah dipakai (harus unique).";
        await setFlash(req, "error", msg, body);

        return res.status(400).render("kost/rooms/new", {
          title: "New Room",
          roomTypes,
          floorOptions: FLOOR_OPTIONS,
          zoneOptions: ZONE_OPTIONS,
          statusOptions: STATUS_OPTIONS,
          form: asObj(body),
          errors: [msg],
        });
      }

      throw err;
    }
  }

  @Get("/:id")
  async detail(@Req() req: ReqWithSession, @Res() res: Response, @Param("id") _id: string, @Query() query: unknown) {
    res.locals.flash = getFlash(req);

    const id = parseIdOr400(req, res);
    if (!id) return;

    const room = await this.roomsRepo.getRoomById(id);
    if (!room) {
      await setFlash(req, "error", "Room tidak ditemukan");
      return res.redirect("/admin/kost/rooms");
    }

    const [roomAmenities, roomTypes] = await Promise.all([
      this.roomAmenitiesRepo.listRoomAmenities(id),
      this.roomTypesRepo.listRoomTypes(),
    ]);

    const roomObj = asObj(room);

    // legacy parity: compute in controller
    const hasAC =
      !!roomObj.has_ac || (Array.isArray(roomAmenities) && roomAmenities.some((a) => asObj(a).amenity_code === "AC"));

    const hasFAN =
      !!roomObj.has_fan || (Array.isArray(roomAmenities) && roomAmenities.some((a) => asObj(a).amenity_code === "FAN"));

    const statusText = String(roomObj.status ?? "").toUpperCase();
    const roomVM = {
      ...roomObj,
      status_text: statusText,
      status_badge_class: roomStatusBadgeClass(statusText),
      base_monthly_price_text: fmtIDR(roomObj.base_monthly_price),
      deposit_amount_text: fmtIDR(roomObj.deposit_amount),
      created_at_text: fmtDateISO(roomObj.created_at),
      updated_at_text: fmtDateISO(roomObj.updated_at),
    };

    const roomAmenitiesVM = (roomAmenities || []).map((row) => {
      const a = asObj(row);
      const conditionText = String(a.condition ?? "").toUpperCase();
      return {
        ...a,
        condition_text: conditionText,
        condition_badge_class: conditionText ? amenityConditionBadgeClass(conditionText) : "text-muted",
      };
    });

    const roomTypesVM = (roomTypes || []).map((row) => {
      const rt = asObj(row);
      return {
        ...rt,
        base_monthly_price_text: fmtIDR(rt.base_monthly_price),
      };
    });

    return res.render("kost/rooms/detail", {
      title: `Room ${String(roomObj.code ?? "")}`,
      room: roomVM,
      roomAmenities: roomAmenitiesVM,
      roomTypes: roomTypesVM,
      hasAC,
      hasFAN,
      query,
    });
  }

  @Get("/:id/edit")
  async showEdit(@Req() req: ReqWithSession, @Res() res: Response) {
    res.locals.flash = getFlash(req);

    const id = parseIdOr400(req, res);
    if (!id) return;

    const [roomTypes, room, roomAmenities] = await Promise.all([
      this.roomTypesRepo.listActiveRoomTypes(),
      this.roomsRepo.getRoomById(id),
      this.roomAmenitiesRepo.listRoomAmenities(id),
    ]);

    if (!room) {
      await setFlash(req, "error", "Room tidak ditemukan");
      return res.redirect("/admin/kost/rooms");
    }

    const r = asObj(room);

    return res.render("kost/rooms/edit", {
      title: `Edit Room ${String(r.code ?? "")}`,
      roomTypes,
      floorOptions: FLOOR_OPTIONS,
      zoneOptions: ZONE_OPTIONS,
      statusOptions: STATUS_OPTIONS,
      form: {
        code: String(r.code ?? ""),
        room_type_id: r.room_type_id as unknown,
        floor: r.floor as unknown,
        position_zone: (r.position_zone ?? "") as unknown,
        status: (r.status ?? "AVAILABLE") as unknown,
        notes: (r.notes ?? "") as unknown,
      },
      roomId: id,
      roomAmenities,
      errors: [],
    });
  }

  @Post("/:id")
  async update(@Req() req: ReqWithSession, @Res() res: Response, @Body() body: unknown) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    const payload0 = normalizeRoomPayload(body);
    const errors = validateRoomPayload(payload0);

    const roomTypes = await this.roomTypesRepo.listActiveRoomTypes();
    const roomAmenities = await this.roomAmenitiesRepo.listRoomAmenities(id);

    if (errors.length) {
      await setFlash(req, "error", errors.join(" "), payload0 as unknown);
      const b = asObj(body);

      return res.status(400).render("kost/rooms/edit", {
        title: `Edit Room ${payload0.code || id}`,
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload0, room_type_id: (b.room_type_id ?? "") as unknown },
        roomId: id,
        roomAmenities,
        errors,
      });
    }

    const payload: RoomPayload = {
      code: payload0.code,
      room_type_id: payload0.room_type_id!,
      floor: payload0.floor as 1 | 2,
      position_zone: payload0.position_zone,
      status: payload0.status,
      notes: payload0.notes,
    };

    try {
      await this.roomsRepo.updateRoom(id, payload);
      await setFlash(req, "success", "Room berhasil diupdate");
      return res.redirect(`/admin/kost/rooms/${id}`);
    } catch (err: unknown) {
      if (getErrCode(err) === "23505") {
        const msg = "Room code sudah dipakai (harus unique).";
        await setFlash(req, "error", msg, body);

        return res.status(400).render("kost/rooms/edit", {
          title: "Edit Room",
          roomTypes,
          floorOptions: FLOOR_OPTIONS,
          zoneOptions: ZONE_OPTIONS,
          statusOptions: STATUS_OPTIONS,
          form: asObj(body),
          roomId: id,
          roomAmenities,
          errors: [msg],
        });
      }
      throw err;
    }
  }

  @Post("/:id/delete")
  async remove(@Req() req: ReqWithSession, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    try {
      // legacy: roomRepo.deleteRoom(id) which means "INACTIVE" (soft)
      await this.roomsRepo.setInactive(id);
      await setFlash(req, "success", "Room di-INACTIVE-kan");
      return res.redirect("/admin/kost/rooms");
    } catch (err: unknown) {
      if (getErrCode(err) === "23503") {
        await setFlash(req, "error", "Tidak bisa menghapus room yang sedang dipakai");
        return res.status(409).send(
          "Tidak bisa delete room karena sudah dipakai oleh data lain (mis. stays). Solusi: set status menjadi INACTIVE.",
        );
      }
      throw err;
    }
  }

  @Post("/:id/activate")
  async activate(@Req() req: ReqWithSession, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    await this.roomsRepo.setAvailable(id);
    await setFlash(req, "success", "Room diaktifkan (status AVAILABLE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/block")
  async block(@Req() req: ReqWithSession, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    await this.roomsRepo.setMaintenance(id);
    await setFlash(req, "success", "Room diblokir (status MAINTENANCE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/unblock")
  async unblock(@Req() req: ReqWithSession, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    await this.roomsRepo.setAvailable(id);
    await setFlash(req, "success", "Room di-unblokir (status AVAILABLE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/change-type")
  async changeRoomType(@Req() req: ReqWithSession, @Res() res: Response, @Body() body: unknown) {
    const roomId = parseIdOr400(req, res);
    if (!roomId) return;

    const b = asObj(body);
    const roomTypeId = optionalSelectInt(b.room_type_id, { min: 1 });

    if (!roomTypeId) {
      await setFlash(req, "error", "room_type_id wajib dipilih");
      return res.redirect(`/admin/kost/rooms/${roomId}`);
    }

    await this.roomsRepo.updateRoomType(roomId, roomTypeId);
    await setFlash(req, "success", "Tipe kamar berhasil diubah");
    return res.redirect(`/admin/kost/rooms/${roomId}?type_changed=1`);
  }
}
