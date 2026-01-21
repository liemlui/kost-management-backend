const stayRepo = require("../repos/stay.repo");
const roomRepo = require("../repos/room.repo");

async function createStay(payload) {
  const { tenant_id, room_id, check_in_at } = payload;

  if (!tenant_id || !room_id || !check_in_at) {
    throw new Error("Tenant, room, and check-in date are required");
  }

  try {
    const result = await stayRepo.createStay(payload);
    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") {
      throw new Error("Room is already occupied");
    }
    throw err;
  }
}

async function endStay(stayId) {
  if (!stayId) throw new Error("Stay ID is required");

  const result = await stayRepo.endStay(stayId, new Date());

  if (result.rowCount === 0) {
    throw new Error("Active stay not found or already ended");
  }

  return result.rows[0];
}

/**
 * Forced checkout:
 * - end stay (status=ENDED, check_out_at=today)
 * - block room
 * - audit logs (STAY + ROOM)
 */
async function forcedCheckout({ stay_id, actor_id, reason }) {
  if (!stay_id || !actor_id || !reason) {
    throw new Error("stay_id, actor_id, and reason are required");
  }

  // BEFORE snapshot
  const beforeRes = await stayRepo.getStaySnapshot(stay_id);
  if (beforeRes.rowCount === 0) throw new Error("Stay not found");

  const before = beforeRes.rows[0];
  if (before.status !== "ACTIVE") {
    throw new Error("Only ACTIVE stay can be forced checkout");
  }

  // End stay (use check_out_at)
  const endRes = await stayRepo.endStay(stay_id, new Date());
  if (endRes.rowCount === 0) throw new Error("Failed to end stay");

  const after = endRes.rows[0];

  // Block room
 const blockRes = await roomRepo.blockRoom(before.room_id);

let room;
if (blockRes.rowCount > 0) {
  room = blockRes.rows[0];
} else {
  // room sudah BLOCKED atau status lain (MAINTENANCE/INACTIVE)
  const roomRes = await roomRepo.getRoomById(before.room_id);
  if (roomRes.rowCount === 0) throw new Error("Room not found");
  room = roomRes.rows[0];
}


  // Audit — STAY
await stayRepo.insertAuditLog({
  actor_id,
  action: "ROOM_BLOCKED_AFTER_FORCED_CHECKOUT",
  entity_type: "ROOM",
  entity_id: room.id,
  before_json: JSON.stringify({  }),
  after_json: JSON.stringify({
    status: room.status,
    reason,
    related_stay_id: stay_id,
  }),
});

  // Audit — ROOM
  await stayRepo.insertAuditLog({
    actor_id,
    action: "ROOM_BLOCKED_AFTER_FORCED_CHECKOUT",
    entity_type: "ROOM",
    entity_id: room.id,
    before_json: JSON.stringify({ status: "ACTIVE" }),
    after_json: JSON.stringify({
      status: room.status,
      reason,
      related_stay_id: stay_id,
    }),
  });

  return { stay: after, room };
}

module.exports = {
  createStay,
  endStay,
  forcedCheckout,
};
