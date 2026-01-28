// modules/kost/sql/inventory/inventoryBalances.sql.js
module.exports = {
  listBalances: `
    SELECT
      b.item_id,
      i.sku,
      i.name AS item_name,
      i.uom,
      i.reorder_point,
      i.reorder_qty,

      b.location_id,
      l.name AS location_name,
      l.location_type,
      l.room_id,

      b.qty_on_hand,
      b.avg_unit_cost,
      b.updated_at
    FROM kost.inventory_balances b
    JOIN kost.inventory_items i ON i.id = b.item_id
    JOIN kost.inventory_locations l ON l.id = b.location_id
    WHERE ($1::bigint IS NULL OR b.item_id = $1::bigint)
      AND ($2::bigint IS NULL OR b.location_id = $2::bigint)
      AND ($3::boolean IS NULL OR (CASE WHEN $3 THEN b.qty_on_hand <= COALESCE(i.reorder_point, 0) ELSE TRUE END))
      AND ($4::boolean IS NULL OR (CASE WHEN $4 THEN b.qty_on_hand = 0 ELSE TRUE END))
    ORDER BY i.name, l.name;
  `,
};
