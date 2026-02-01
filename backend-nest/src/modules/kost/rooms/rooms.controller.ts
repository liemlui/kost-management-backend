import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { RoomsRepo } from "./rooms.repo";
import { RoomTypesRepo } from "../roomTypes/roomTypes.repo";
import { toIntOrNull, toNullIfEmpty, toSelectIntOrNull } from "../../../shared/parsers";
import { setFlash, setFlashErrors } from "../../../shared/flash";
import { logger } from "../../../config/logger";

const FLOOR_OPTIONS = [1, 2] as const;
const ZONE_OPTIONS = ["", "FRONT", "MIDDLE", "BACK"] as const;
const STATUS_OPTIONS = ["AVAILABLE", "MAINTENANCE", "INACTIVE"] as const;

type RoomStatus = (typeof STATUS_OPTIONS)[number];

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
  if (!p.floor || !FLOOR_OPTIONS.includes(p.floor as any)) errors.push("Floor hanya boleh 1 atau 2.");
  if (p.position_zone && !(ZONE_OPTIONS as readonly string[]).includes(p.position_zone)) errors.push("Position zone tidak valid.");
  if (!(STATUS_OPTIONS as readonly string[]).includes(p.status)) errors.push("Status tidak valid.");
  return errors;
}

function parseIdOr400(idRaw: string, res: Response): number | null {
  const id = toIntOrNull(idRaw);
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
  ) {}

  @Get("/")
  async index(@Res() res: Response, @Query("room_type_id") roomTypeIdQ?: string) {
    const roomTypeId = toIntOrNull(roomTypeIdQ);
    const [rooms, roomTypes] = await Promise.all([
      this.roomsRepo.listRooms(roomTypeId),
      this.roomTypesRepo.listActiveRoomTypes(),
    ]);

    // VIEW: kost/rooms/index.ejs (⚠️ masih perlu kamu upload)
    return res.render("kost/rooms/index", {
      title: "Rooms",
      rooms,
      roomTypes,
      filters: { room_type_id: roomTypeId },
    });
  }

  @Get("/new")
  async showNew(@Res() res: Response) {
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
  async create(@Res() res: Response, @Body() body: any, @Param() _p: any, @Query() _q: any) {
    logger.info("rooms.create.start", {});

    const payload = normalizeRoomPayload(body);
    const errors = validateRoomPayload(payload);
    const roomTypes = await this.roomTypesRepo.listActiveRoomTypes();

    if (errors.length) {
      await setFlashErrors({ body } as any, errors); // flash impl kamu pakai req; nanti kita ganti ke req beneran di wiring
      return res.status(400).render("kost/rooms/new", {
        title: "New Room",
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload, room_type_id: body.room_type_id ?? "" },
        errors,
      });
    }

    try {
      const inserted = await this.roomsRepo.insertRoom(payload as any);
      const newId = inserted?.id;
      if (!newId) throw Object.assign(new Error("Insert room succeeded but no id returned."), { status: 500 });

      await setFlash({} as any, "success", `Room "${payload.code}" berhasil dibuat`);
      return res.redirect(`/admin/kost/rooms/${newId}`);
    } catch (err: any) {
      if (err?.code === "23505") {
        const msg = "Room code sudah dipakai (harus unique).";
        await setFlashErrors({} as any, msg);
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
  async detail(@Res() res: Response, @Param("id") idRaw: string, @Query() query: any) {
    const id = parseIdOr400(idRaw, res);
    if (!id) return;

    const room = await this.roomsRepo.getRoomById(id);
    if (!room) {
      await setFlash({} as any, "error", "Room tidak ditemukan");
      return res.redirect("/admin/kost/rooms");
    }

    // roomAmenities + hasAC/hasFAN akan kita pasang di Phase 2 (controller amenities)
    return res.render("kost/rooms/detail", {
      title: `Room ${room.code}`,
      room,
      roomAmenities: [],
      roomTypes: await this.roomTypesRepo.listRoomTypes(),
      hasAC: !!room.has_ac,
      hasFAN: !!room.has_fan,
      query,
    });
  }

  @Get("/:id/edit")
  async showEdit(@Res() res: Response, @Param("id") idRaw: string) {
    const id = parseIdOr400(idRaw, res);
    if (!id) return;

    const [roomTypes, room] = await Promise.all([
      this.roomTypesRepo.listActiveRoomTypes(),
      this.roomsRepo.getRoomById(id),
    ]);

    if (!room) {
      await setFlash({} as any, "error", "Room tidak ditemukan");
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
      roomAmenities: [],
      errors: [],
    });
  }

  @Post("/:id")
  async update(@Res() res: Response, @Param("id") idRaw: string, @Body() body: any) {
    const id = parseIdOr400(idRaw, res);
    if (!id) return;

    const payload = normalizeRoomPayload(body);
    const errors = validateRoomPayload(payload);
    const roomTypes = await this.roomTypesRepo.listActiveRoomTypes();

    if (errors.length) {
      return res.status(400).render("kost/rooms/edit", {
        title: `Edit Room ${payload.code || id}`,
        roomTypes,
        floorOptions: FLOOR_OPTIONS,
        zoneOptions: ZONE_OPTIONS,
        statusOptions: STATUS_OPTIONS,
        form: { ...payload, room_type_id: body.room_type_id ?? "" },
        roomId: id,
        errors,
      });
    }

    try {
      await this.roomsRepo.updateRoom(id, payload as any);
      await setFlash({} as any, "success", "Room berhasil diupdate");
      return res.redirect(`/admin/kost/rooms/${id}`);
    } catch (err: any) {
      if (err?.code === "23505") {
        const msg = "Room code sudah dipakai (harus unique).";
        return res.status(400).render("kost/rooms/edit", {
          title: `Edit Room`,
          roomTypes,
          floorOptions: FLOOR_OPTIONS,
          zoneOptions: ZONE_OPTIONS,
          statusOptions: STATUS_OPTIONS,
          form: body,
          roomId: id,
          errors: [msg],
        });
      }
      throw err;
    }
  }

  @Post("/:id/delete")
  async remove(@Res() res: Response, @Param("id") idRaw: string) {
    const id = parseIdOr400(idRaw, res);
    if (!id) return;

    try {
      await this.roomsRepo.setInactive(id);
      await setFlash({} as any, "success", "Room di-INACTIVE-kan");
      return res.redirect("/admin/kost/rooms");
    } catch (err: any) {
      if (err?.code === "23503") {
        await setFlash({} as any, "error", "Tidak bisa menghapus room yang sedang dipakai");
        return res.status(409).send(
          "Tidak bisa delete room karena sudah dipakai oleh data lain (mis. stays). Solusi: set status menjadi INACTIVE."
        );
      }
      throw err;
    }
  }

  @Post("/:id/block")
  async block(@Res() res: Response, @Param("id") idRaw: string) {
    const id = parseIdOr400(idRaw, res);
    if (!id) return;
    await this.roomsRepo.setMaintenance(id);
    await setFlash({} as any, "success", "Room diblokir (status MAINTENANCE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/unblock")
  async unblock(@Res() res: Response, @Param("id") idRaw: string) {
    const id = parseIdOr400(idRaw, res);
    if (!id) return;
    await this.roomsRepo.setAvailable(id);
    await setFlash({} as any, "success", "Room di-unblokir (status AVAILABLE)");
    return res.redirect(`/admin/kost/rooms/${id}`);
  }

  @Post("/:id/change-type")
  async changeRoomType(@Res() res: Response, @Param("id") idRaw: string, @Body() body: any) {
    const roomId = parseIdOr400(idRaw, res);
    if (!roomId) return;

    const roomTypeId = toSelectIntOrNull(body.room_type_id);
    if (!roomTypeId) {
      await setFlash({} as any, "error", "room_type_id wajib dipilih");
      return res.redirect(`/admin/kost/rooms/${roomId}`);
    }

    await this.roomsRepo.updateRoomType(roomId, roomTypeId);
    await setFlash({} as any, "success", "Tipe kamar berhasil diubah");
    return res.redirect(`/admin/kost/rooms/${roomId}?type_changed=1`);
  }
}
