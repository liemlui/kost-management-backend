module.exports = {
  // 1) Total stock per item (all locations)
  stockByItem: `
    SELECT
      i.id,
      i.name,
      i.uom,
      i.reorder_point,
      i.reorder_qty,
      COALESCE(SUM(b.qty_on_hand), 0) AS total_qty_on_hand
    FROM kost.inventory_items i
    LEFT JOIN kost.inventory_balances b ON b.item_id = i.id
    WHERE i.is_active = true
    GROUP BY i.id, i.name, i.uom, i.reorder_point, i.reorder_qty
    ORDER BY i.name;
  `,

  // 2) Usage 30 hari terakhir (USE only)
  usageLast30Days: `
    SELECT
      m.item_id,
      SUM(m.qty) AS total_use_30d
    FROM kost.inventory_movements m
    WHERE m.movement_type = 'USE'
      AND m.created_at >= now() - interval '30 days'
    GROUP BY m.item_id;
  `,

  // 3) Top used items (30d)
  topUsedLast30Days: `
    SELECT
      i.id,
      i.name,
      i.uom,
      SUM(m.qty) AS total_use_30d
    FROM kost.inventory_movements m
    JOIN kost.inventory_items i ON i.id = m.item_id
    WHERE m.movement_type = 'USE'
      AND m.created_at >= now() - interval '30 days'
      AND i.is_active = true
    GROUP BY i.id, i.name, i.uom
    ORDER BY total_use_30d DESC
    LIMIT 10;
  `,
};
