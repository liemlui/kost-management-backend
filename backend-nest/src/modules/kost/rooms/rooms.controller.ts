import { Body, Controller, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { RoomsRepo, type RoomPayload, type RoomStatus } from "./rooms.repo";
import { RoomTypesRepo } from "./roomTypes.repo";
import { RoomAmenitiesRepo } from "./roomAmenities.repo";
import { optionalInt, optionalSelectInt, optionalString } from "../../../shared/parsers";
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

type RoomFormShape = {
  code: string;
  room_type_id: number | null;
  floor: number | null;
  position_zone: string | null;
  status: RoomStatus;
  notes: string | null;
};

function normalizeRoomPayload(body: unknown): RoomFormShape {
  const b = (body && typeof body === "object") ? (body as Record<string, unknown>) : {};

  const code = String(b.code ?? "").trim();
  const room_type_id = optionalSelectInt(b.room_type_id, { min: 1 });
  const floor = optionalInt(b.floor, { min: 1 });
  const position_zone = optionalString(b.position_zone);
  const status = String(b.status ?? "AVAILABLE").trim() as RoomStatus;
  const notes = optionalString(b.notes);

  return { code, room_type_id, floor, position_zone, status, notes };
}

function validateRoomPayload(p: RoomFormShape): string[] {
  const errors: string[] = [];
  if (!p.code) errors.push("Code wajib diisi.");
  if (!p.room_type_id || Number.isNaN(p.room_type_id)) errors.push("Room type wajib dipilih.");
  if (!p.floor || !(FLOOR_OPTIONS as readonly number[]).includes(p.floor)) errors.push("Floor hanya boleh 1 atau 2.");
  if (p.position_zone && !(ZONE_OPTIONS as readonly string[]).includes(p.position_zone))
    errors.push("Position zone tidak valid.");
  if (!(STATUS_OPTIONS as readonly string[]).includes(p.status)) errors.push("Status tidak valid.");
  return errors;
}

function parseIdOr400(req: Request, res: Response): number | null {
  const id = optionalInt((req.params as any)?.id, { min: 1 });
  if (!id) {
    res.status(400).send("Invalid id");
    return null;
  }
  return id;
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
    res.locals.flash = getFlash(req as any);

    const roomTypeId = optionalInt(roomTypeIdQ, { min: 1 });
    const [rooms, roomTypes] = await Promise.all([
      this.roomsRepo.listRooms(roomTypeId),
      this.roomTypesRepo.listActiveRoomTypes(),
    ]);

    const roomsVM = (rooms || []).map((r: any) => {
      const statusText = String(r?.status || "").toUpperCase();
      return {
        ...r,
        status_text: statusText,
        status_badge_class: roomStatusBadgeClass(statusText),
        base_monthly_price_text: fmtIDR((r as any)?.base_monthly_price),
        deposit_amount_text: fmtIDR((r as any)?.deposit_amount),
        created_at_text: fmtDateISO((r as any)?.created_at),
        updated_at_text: fmtDateISO((r as any)?.updated_at),
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
  async showNew(@Req() req: Request, @Res() res: Response) {
    res.locals.flash = getFlash(req as any);

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
  async create(@Req() req: any, @Res() res: Response, @Body() body: unknown) {
    logger.info("rooms.create.start", {
      sessionId: req.sessionID ? String(req.sessionID).slice(0, 10) + "..." : null,
    });

    const payload0 = normalizeRoomPayload(body);
    const errors = validateRoomPayload(payload0);
    const roomTypes = await this.roomTypesRepo.listActiveRoomTypes();

    if (errors.length) {
      await setFlash(req, "error", errors.join(" "), payload0 as any);
      return res.status(400).render("kost/rooms/new", {
        title: "New Room",
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload0, room_type_id: (body as any)?.room_type_id ?? "" },
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
      await setFlash(req, "success", `Room "${payload.code}" berhasil dibuat`);
      return res.redirect(`/admin/kost/rooms/${newId}`);
    } catch (err: any) {
      logger.error("rooms.create.error", { error: err?.message, code: err?.code });

      if (err?.code === "23505") {
        const msg = "Room code sudah dipakai (harus unique).";
        await setFlash(req, "error", msg, (body as any) ?? null);
        return res.status(400).render("kost/rooms/new", {
          title: "New Room",
          roomTypes,
          floorOptions: FLOOR_OPTIONS,
          zoneOptions: ZONE_OPTIONS,
          statusOptions: STATUS_OPTIONS,
          form: (body as any) ?? {},
          errors: [msg],
        });
      }
      throw err;
    }
  }

  @Get("/:id")
  async detail(@Req() req: any, @Res() res: Response, @Param("id") _id: string, @Query() query: any) {
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

    const hasAC = !!(room as any).has_ac || (roomAmenities || []).some((a: any) => a.amenity_code === "AC");
    const hasFAN = !!(room as any).has_fan || (roomAmenities || []).some((a: any) => a.amenity_code === "FAN");

    const statusText = String((room as any)?.status || "").toUpperCase();
    const roomVM = {
      ...room,
      status_text: statusText,
      status_badge_class: roomStatusBadgeClass(statusText),
      base_monthly_price_text: fmtIDR((room as any)?.base_monthly_price),
      deposit_amount_text: fmtIDR((room as any)?.deposit_amount),
      created_at_text: fmtDateISO((room as any)?.created_at),
      updated_at_text: fmtDateISO((room as any)?.updated_at),
    };

    const roomAmenitiesVM = (roomAmenities || []).map((a: any) => {
      const conditionText = String(a?.condition || "").toUpperCase();
      return {
        ...a,
        condition_text: conditionText,
        condition_badge_class: conditionText ? amenityConditionBadgeClass(conditionText) : "text-muted",
      };
    });

    const roomTypesVM = (roomTypes || []).map((rt: any) => ({
      ...rt,
      base_monthly_price_text: fmtIDR((rt as any)?.base_monthly_price),
    }));

    return res.render("kost/rooms/detail", {
      title: `Room ${(room as any).code}`,
      room: roomVM,
      roomAmenities: roomAmenitiesVM,
      roomTypes: roomTypesVM,
      hasAC,
      hasFAN,
      query,
    });
  }

  @Get("/:id/edit")
  async showEdit(@Req() req: any, @Res() res: Response) {
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

    return res.render("kost/rooms/edit", {
      title: `Edit Room ${(room as any).code}`,
      roomTypes,
      floorOptions: FLOOR_OPTIONS,
      zoneOptions: ZONE_OPTIONS,
      statusOptions: STATUS_OPTIONS,
      form: {
        code: (room as any).code,
        room_type_id: (room as any).room_type_id,
        floor: (room as any).floor,
        position_zone: (room as any).position_zone ?? "",
        status: (room as any).status,
        notes: (room as any).notes ?? "",
      },
      roomId: id,
      roomAmenities,
      errors: [],
    });
  }

  @Post("/:id")
  async update(@Req() req: any, @Res() res: Response, @Body() body: unknown) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    const payload0 = normalizeRoomPayload(body);
    const errors = validateRoomPayload(payload0);
    const roomTypes = await this.roomTypesRepo.listActiveRoomTypes();
    const roomAmenities = await this.roomAmenitiesRepo.listRoomAmenities(id);

    if (errors.length) {
      await setFlash(req, "error", errors.join(" "), payload0 as any);
      return res.status(400).render("kost/rooms/edit", {
        title: `Edit Room ${payload0.code || id}`,
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload0, room_type_id: (body as any)?.room_type_id ?? "" },
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
      await setFlash(req, "success", "Room berhasil diupdate");
      return res.redirect(`/admin/kost/rooms/${id}`);
    } catch (err: any) {
      if (err?.code === "23505") {
        const msg = "Room code sudah dipakai (harus unique).";
        await setFlash(req, "error", msg, (body as any) ?? null);
        return res.status(400).render("kost/rooms/edit", {
          title: "Edit Room",
          roomTypes,
          floorOptions: FLOOR_OPTIONS,
          zoneOptions: ZONE_OPTIONS,
          statusOptions: STATUS_OPTIONS,
          form: (body as any) ?? {},
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
      await setFlash(req, "success", "Room di-INACTIVE-kan");
      return res.redirect("/admin/kost/rooms");
    } catch (err: any) {
      if (err?.code === "23503") {
        await setFlash(req, "error", "Tidak bisa menghapus room yang sedang dipakai");
        return res.status(409).send(
          "Tidak bisa delete room karena sudah dipakai oleh data lain (mis. stays). Solusi: set status menjadi INACTIVE.",
        );
      }
      throw err;
    }
  }

  @Post("/:id/activate")
  async activate(@Req() req: any, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    await this.roomsRepo.setAvailable(id);
    await setFlash(req, "success", "Room diaktifkan (status AVAILABLE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/block")
  async block(@Req() req: any, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    await this.roomsRepo.setMaintenance(id);
    await setFlash(req, "success", "Room diblokir (status MAINTENANCE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/unblock")
  async unblock(@Req() req: any, @Res() res: Response) {
    const id = parseIdOr400(req, res);
    if (!id) return;

    await this.roomsRepo.setAvailable(id);
    await setFlash(req, "success", "Room di-unblokir (status AVAILABLE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/change-type")
  async changeRoomType(@Req() req: any, @Res() res: Response, @Body() body: unknown) {
    const roomId = parseIdOr400(req, res);
    if (!roomId) return;

    const b = (body && typeof body === "object") ? (body as Record<string, unknown>) : {};
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
