// modules/kost/repos/rooms/roomLookup.repo.js
const roomRepo = require("./room.repo");

/**
 * Compatibility wrapper.
 * SSOT: room.repo.js + rooms.sql.js
 */
async function listRoomsForDropdown() {
  return roomRepo.listRoomsForDropdown();
}

module.exports = { listRoomsForDropdown };
