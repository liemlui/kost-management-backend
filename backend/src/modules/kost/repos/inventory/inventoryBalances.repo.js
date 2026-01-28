// modules/kost/repos/inventory/inventoryBalances.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");

async function listBalances(filters = {}) {
  const item_id = filters.item_id ? Number(filters.item_id) : null;
  const location_id = filters.location_id ? Number(filters.location_id) : null;

  const only_low =
    filters.only_low === true ||
    String(filters.only_low || "").toLowerCase() === "true" ||
    String(filters.only_low || "").toLowerCase() === "on" ||
    String(filters.only_low || "") === "1"
      ? true
      : null;

  const only_zero =
    filters.only_zero === true ||
    String(filters.only_zero || "").toLowerCase() === "true" ||
    String(filters.only_zero || "").toLowerCase() === "on" ||
    String(filters.only_zero || "") === "1"
      ? true
      : null;

  const { rows } = await query(
    sql.inventory.listBalances,
    [item_id, location_id, only_low, only_zero],
    "kost.inventory.balances.list"
  );
  return rows;
}

module.exports = { listBalances };
