// modules/kost/repos/rooms/roomLookup.repo.js
const roomRepo = require("./room.repo");

/**
 * Compatibility wrapper.
 * SSOT: room.repo.js + rooms.sql.js
 * Note: boleh dihapus nanti setelah semua pemanggil pindah langsung ke roomRepo.
 */
async function listRoomsForDropdown() {
  return roomRepo.listRoomsForDropdown();
}

module.exports = { listRoomsForDropdown };
