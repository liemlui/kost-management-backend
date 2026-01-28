const { query } = require("../../../../db/pool");

async function listRoomsForDropdown() {
  const sql = `
    SELECT id, code
    FROM kost.rooms
    ORDER BY floor, code;
  `;
  const { rows } = await query(sql, [], { label: "kost.rooms.listForDropdown" });
  return rows;
}

module.exports = { listRoomsForDropdown };
