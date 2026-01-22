// modules/kost/repos/ops/overdue.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql");

/**
 * List stays that are overdue by H+7 (or per your SQL logic).
 * Returns rows[].
 */
async function listOverdueStaysHPlus7() {
  const result = await query(
    sql.ops.listOverdueStaysHPlus7,
    [],
    { label: "kost.ops.listOverdueStaysHPlus7" }
  );

  return result.rows;
}

module.exports = {
  listOverdueStaysHPlus7,
};
