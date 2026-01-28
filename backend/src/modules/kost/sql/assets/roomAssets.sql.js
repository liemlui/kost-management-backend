// pwe/backend/src/modules/kost/sql/assets/roomAssets.sql.js
module.exports = {
  listByRoom: `
    SELECT
      ra.id,
      ra.room_id,
      ra.inventory_item_id,
      ii.sku,
      ii.name AS item_name,
      ii.uom,
      ra.qty,
      ra.status,
      ra.note,
      ra.assigned_at,
      ra.assigned_by,
      ra.removed_at,
      ra.remove_reason,
      ra.updated_at
    FROM kost.room_assets ra
    JOIN kost.inventory_items ii ON ii.id = ra.inventory_item_id
    WHERE ra.room_id = $1
      AND ra.status <> 'REMOVED'
    ORDER BY
      CASE ra.status
        WHEN 'IN_ROOM' THEN 1
        WHEN 'IN_REPAIR' THEN 2
        ELSE 9
      END,
      ii.name,
      ra.assigned_at DESC;
  `,

  listActiveItems: `
    SELECT id, sku, name, uom, item_type, category
    FROM kost.inventory_items
    WHERE is_active = TRUE
    ORDER BY name;
  `,

  assign: `
    INSERT INTO kost.room_assets
      (room_id, inventory_item_id, qty, status, note, assigned_by)
    VALUES
      ($1, $2, $3, 'IN_ROOM', $4, $5)
    RETURNING *;
  `,

  markRepair: `
    UPDATE kost.room_assets
    SET status = 'IN_REPAIR'
    WHERE id = $1
      AND room_id = $2
      AND status = 'IN_ROOM'
    RETURNING *;
  `,

  markBackToRoom: `
    UPDATE kost.room_assets
    SET status = 'IN_ROOM'
    WHERE id = $1
      AND room_id = $2
      AND status = 'IN_REPAIR'
    RETURNING *;
  `,

  remove: `
    UPDATE kost.room_assets
    SET status = 'REMOVED',
        remove_reason = $3,
        removed_by = $4
    WHERE id = $1
      AND room_id = $2
      AND status <> 'REMOVED'
    RETURNING *;
  `,
};
