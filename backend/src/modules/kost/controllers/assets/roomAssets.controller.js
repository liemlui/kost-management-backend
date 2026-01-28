// pwe/backend/src/modules/kost/controllers/assets/roomAssets.controller.js
const repo = require("../../repos/assets/roomAssets.repo");
const { toIntOrNull, toNumOrNull, toNullIfEmpty } = require("../../../../shared/parsers");

async function page(req, res, next) {
  try {
    const roomId = Number(req.params.id);

    const [assetsRes, itemsRes] = await Promise.all([
      repo.listByRoom(roomId),
      repo.listActiveItems(),
    ]);

    res.render("kost/assets/roomAssets", {
      title: `Room Assets`,
      roomId,
      assets: assetsRes.rows,
      items: itemsRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

async function assign(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const inventoryItemId = toIntOrNull(req.body.inventory_item_id);
    const qty = toNumOrNull(req.body.qty) ?? 1;
    const note = toNullIfEmpty(req.body.note);

    if (!inventoryItemId) {
      const e = new Error("Item wajib dipilih");
      e.status = 400;
      throw e;
    }

    // kalau nanti ada auth: const actorUserId = req.user?.id
    const actorUserId = null;

    await repo.assign({
      room_id: roomId,
      inventory_item_id: inventoryItemId,
      qty,
      note,
      actor_user_id: actorUserId,
    });

    res.redirect(`/admin/kost/rooms/${roomId}/assets`);
  } catch (err) {
    next(err);
  }
}

async function markRepair(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const assetId = Number(req.params.assetId);

    const r = await repo.markRepair({ asset_id: assetId, room_id: roomId });
    if (r.rowCount === 0) {
      const e = new Error("Asset tidak ditemukan / status tidak valid (harus IN_ROOM)");
      e.status = 400;
      throw e;
    }

    res.redirect(`/admin/kost/rooms/${roomId}/assets`);
  } catch (err) {
    next(err);
  }
}

async function markBackToRoom(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const assetId = Number(req.params.assetId);

    const r = await repo.markBackToRoom({ asset_id: assetId, room_id: roomId });
    if (r.rowCount === 0) {
      const e = new Error("Asset tidak ditemukan / status tidak valid (harus IN_REPAIR)");
      e.status = 400;
      throw e;
    }

    res.redirect(`/admin/kost/rooms/${roomId}/assets`);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const roomId = Number(req.params.id);
    const assetId = Number(req.params.assetId);
    const reason = toNullIfEmpty(req.body.remove_reason) || "removed by admin";

    const actorUserId = null;

    const r = await repo.remove({
      asset_id: assetId,
      room_id: roomId,
      reason,
      actor_user_id: actorUserId,
    });

    if (r.rowCount === 0) {
      const e = new Error("Asset tidak ditemukan / sudah REMOVED");
      e.status = 400;
      throw e;
    }

    res.redirect(`/admin/kost/rooms/${roomId}/assets`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  page,
  assign,
  markRepair,
  markBackToRoom,
  remove,
};
