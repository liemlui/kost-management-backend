const { query } = require("../../../../db/pool");
const sql = require("../../sql");

async function q(statement, params, label) {
  return query(statement, params, { label });
}

async function listItems() {
  const { rows } = await q(
    sql.inventory.listItems,
    [],
    "kost.inventory.items.list"
  );
  return rows;
}

async function getById(id) {
  const { rows } = await q(
    sql.inventory.getItemById,
    [id],
    "kost.inventory.items.getById"
  );
  return rows[0] || null;
}

async function insertItem(p) {
  const { rows } = await q(
    sql.inventory.insertItem,
    [
      p.sku,
      p.name,
      p.category,
      p.item_type,
      p.uom,
      p.reorder_point,
      p.reorder_qty,
      p.is_active,
    ],
    "kost.inventory.items.insert"
  );
  return rows[0];
}

async function updateItem(id, p) {
  await q(
    sql.inventory.updateItem,
    [
      id,
      p.sku,
      p.name,
      p.category,
      p.item_type,
      p.uom,
      p.reorder_point,
      p.reorder_qty,
      p.is_active,
    ],
    "kost.inventory.items.update"
  );
}

async function softDelete(id) {
  await q(
    sql.inventory.softDeleteItem,
    [id],
    "kost.inventory.items.softDelete"
  );
}

module.exports = {
  listItems,
  getById,
  insertItem,
  updateItem,
  softDelete,
};
