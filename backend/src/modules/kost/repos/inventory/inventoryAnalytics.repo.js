const { query } = require("../../../../db/pool");
const sql = require("../../sql");

async function stockByItem() {
  const { rows } = await query(sql.inventory.stockByItem, [], "kost.inventory.analytics.stockByItem");
  return rows;
}

async function usageLast30Days() {
  const { rows } = await query(sql.inventory.usageLast30Days, [], "kost.inventory.analytics.usage30d");
  return rows;
}

async function topUsedLast30Days() {
  const { rows } = await query(sql.inventory.topUsedLast30Days, [], "kost.inventory.analytics.topUsed30d");
  return rows;
}

module.exports = {
  stockByItem,
  usageLast30Days,
  topUsedLast30Days,
};
