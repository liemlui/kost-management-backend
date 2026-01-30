// src/modules/kost/repos/rooms/roomLookup.repo.js
const roomRepo = require("./room.repo");

/**
 * Room lookup for dropdowns/autocomplete.
 * Query tetap 1 sumber di room.repo.js (no duplication).
 */
async function listRoomsForDropdown() {
  return roomRepo.listRoomsForDropdown();
}

module.exports = { listRoomsForDropdown };
