// pwe/backend/src/modules/kost/repos/assets/roomAssets.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");

function listByRoom(roomId) {
  return query(sql.assets.roomAssets.listByRoom, [roomId], "kost.assets.roomAssets.listByRoom");
}

function listActiveItems() {
  return query(sql.assets.roomAssets.listActiveItems, [], "kost.assets.roomAssets.listActiveItems");
}

function assign({ room_id, inventory_item_id, qty, note, actor_user_id }) {
  return query(
    sql.assets.roomAssets.assign,
    [room_id, inventory_item_id, qty, note ?? null, actor_user_id ?? null],
    "kost.assets.roomAssets.assign"
  );
}

function markRepair({ asset_id, room_id }) {
  return query(
    sql.assets.roomAssets.markRepair,
    [asset_id, room_id],
    "kost.assets.roomAssets.markRepair"
  );
}

function markBackToRoom({ asset_id, room_id }) {
  return query(
    sql.assets.roomAssets.markBackToRoom,
    [asset_id, room_id],
    "kost.assets.roomAssets.markBackToRoom"
  );
}

function remove({ asset_id, room_id, reason, actor_user_id }) {
  return query(
    sql.assets.roomAssets.remove,
    [asset_id, room_id, reason ?? null, actor_user_id ?? null],
    "kost.assets.roomAssets.remove"
  );
}

module.exports = {
  listByRoom,
  listActiveItems,
  assign,
  markRepair,
  markBackToRoom,
  remove,
};
