module.exports = {
listItems: `
    SELECT
      i.id,
      i.sku,
      i.name,
      i.category,
      i.item_type,
      i.uom,
      i.reorder_point,
      i.reorder_qty,
      i.is_active,
      i.created_at,
      i.updated_at,

      COALESCE(SUM(b.qty_on_hand), 0) AS total_qty_on_hand,

      CASE
        WHEN i.reorder_point IS NULL THEN false
        WHEN COALESCE(SUM(b.qty_on_hand), 0) <= i.reorder_point THEN true
        ELSE false
      END AS is_low_stock

    FROM kost.inventory_items i
    LEFT JOIN kost.inventory_balances b
      ON b.item_id = i.id
    GROUP BY
      i.id, i.sku, i.name, i.category, i.item_type, i.uom,
      i.reorder_point, i.reorder_qty, i.is_active, i.created_at, i.updated_at
    ORDER BY i.name;
  `,

  getItemById: `
    SELECT *
    FROM kost.inventory_items
    WHERE id = $1;
  `,

  insertItem: `
    INSERT INTO kost.inventory_items
    (sku, name, category, item_type, uom, reorder_point, reorder_qty, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id;
  `,

  updateItem: `
    UPDATE kost.inventory_items
    SET
      sku = $2,
      name = $3,
      category = $4,
      item_type = $5,
      uom = $6,
      reorder_point = $7,
      reorder_qty = $8,
      is_active = $9,
      updated_at = now()
    WHERE id = $1;
  `,

  softDeleteItem: `
    UPDATE kost.inventory_items
    SET is_active = false, updated_at = now()
    WHERE id = $1;
  `,
};
