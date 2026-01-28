module.exports = {
  listActiveItems: `
    SELECT id, sku, name, item_type, uom, reorder_point, reorder_qty
    FROM kost.inventory_items
    WHERE is_active = true
    ORDER BY name;
  `,

  listActiveLocations: `
    SELECT
      l.id,
      l.location_type,
      l.room_id,
      l.name
    FROM kost.inventory_locations l
    WHERE l.is_active = true
    ORDER BY l.name;
  `,

  listMovements: `
    SELECT
      m.id,
      m.created_at,
      m.movement_type,
      m.qty,
      m.unit_cost,
      m.condition_after,
      m.notes,
      m.source,

      i.id AS item_id,
      i.name AS item_name,
      i.uom AS item_uom,

      lf.id AS from_location_id,
      lf.name AS from_location_name,

      lt.id AS to_location_id,
      lt.name AS to_location_name

    FROM kost.inventory_movements m
    JOIN kost.inventory_items i ON i.id = m.item_id
    LEFT JOIN kost.inventory_locations lf ON lf.id = m.from_location_id
    LEFT JOIN kost.inventory_locations lt ON lt.id = m.to_location_id
    WHERE
      ($1::bigint IS NULL OR m.item_id = $1)
      AND ($2::text IS NULL OR m.movement_type = $2)
    ORDER BY m.created_at DESC
    LIMIT 200;
  `,

  insertMovement: `
    INSERT INTO kost.inventory_movements
      (item_id, from_location_id, to_location_id, movement_type, qty, unit_cost, condition_after, notes, source, finance_txn_id)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id;
  `,

  getBalance: `
    SELECT item_id, location_id, qty_on_hand, avg_unit_cost
    FROM kost.inventory_balances
    WHERE item_id = $1 AND location_id = $2;
  `,

  decreaseBalanceGuarded: `
    UPDATE kost.inventory_balances
    SET qty_on_hand = qty_on_hand - $3,
        updated_at = now()
    WHERE item_id = $1
      AND location_id = $2
      AND qty_on_hand >= $3
    RETURNING qty_on_hand, avg_unit_cost;
  `,

  // add qty to balance; if unit_cost is provided, weighted average cost update
  increaseBalanceUpsert: `
    INSERT INTO kost.inventory_balances (item_id, location_id, qty_on_hand, avg_unit_cost, updated_at)
    VALUES ($1, $2, $3, $4, now())
    ON CONFLICT (item_id, location_id)
    DO UPDATE SET
      qty_on_hand = kost.inventory_balances.qty_on_hand + EXCLUDED.qty_on_hand,
      avg_unit_cost = CASE
        WHEN EXCLUDED.avg_unit_cost IS NULL THEN kost.inventory_balances.avg_unit_cost
        WHEN kost.inventory_balances.avg_unit_cost IS NULL THEN EXCLUDED.avg_unit_cost
        WHEN (kost.inventory_balances.qty_on_hand + EXCLUDED.qty_on_hand) = 0 THEN NULL
        ELSE (
          (kost.inventory_balances.qty_on_hand * kost.inventory_balances.avg_unit_cost) +
          (EXCLUDED.qty_on_hand * EXCLUDED.avg_unit_cost)
        ) / (kost.inventory_balances.qty_on_hand + EXCLUDED.qty_on_hand)
      END,
      updated_at = now()
    RETURNING qty_on_hand, avg_unit_cost;
  `,
  ensureDefaultGudangUtama: `
  INSERT INTO kost.inventory_locations (location_type, room_id, name, is_active)
  SELECT 'GENERAL', NULL, 'Gudang Utama', true
  WHERE NOT EXISTS (
    SELECT 1
    FROM kost.inventory_locations
    WHERE location_type = 'GENERAL'
      AND room_id IS NULL
      AND name = 'Gudang Utama'
  );
`,

};
