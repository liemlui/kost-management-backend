module.exports = {
  listLocations: `
    SELECT
      l.id,
      l.location_type,
      l.room_id,
      l.name,
      l.is_active,
      l.created_at
    FROM kost.inventory_locations l
    ORDER BY l.name;
  `,

  getLocationById: `
    SELECT
      l.id,
      l.location_type,
      l.room_id,
      l.name,
      l.is_active,
      l.created_at
    FROM kost.inventory_locations l
    WHERE l.id = $1;
  `,

  insertLocation: `
    INSERT INTO kost.inventory_locations (location_type, room_id, name, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
  `,

  updateLocation: `
    UPDATE kost.inventory_locations
    SET
      location_type = $2,
      room_id = $3,
      name = $4,
      is_active = $5
    WHERE id = $1;
  `,

  softDeleteLocation: `
    UPDATE kost.inventory_locations
    SET is_active = false
    WHERE id = $1;
  `,

  // dipakai dropdown movement (aktif saja)
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
};
