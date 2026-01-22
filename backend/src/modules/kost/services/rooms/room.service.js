// modules/kost/services/rooms/room.service.js
const roomRepo = require('../../repos/rooms/room.repo');
const stayRepo = require('../../repos/stays/stay.repo');

async function unblockRoom({
  room_id,
  actor_id,
  reason,
}) {
  if (!room_id || !actor_id || !reason) {
    throw new Error('room_id, actor_id, and reason are required');
  }

  const res = await roomRepo.unblockRoom(room_id);
  if (res.rowCount === 0) {
    throw new Error('Room not blocked or not found');
  }

  const room = res.rows[0];

  await stayRepo.insertAuditLog({
    actor_id,
    action: 'ROOM_UNBLOCKED',
    entity_type: 'ROOM',
    entity_id: room_id,
    before_json: JSON.stringify({ status: 'BLOCKED' }),
    after_json: JSON.stringify({ status: 'ACTIVE', reason }),
  });

  return room;
}

module.exports = {
  unblockRoom,
};
