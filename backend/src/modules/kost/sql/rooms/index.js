// src/modules/kost/sql/rooms/index.js
// SSOT aggregator + guard anti duplicate key (biar tidak bisa override diam-diam)

function mergeNoDup(...modules) {
  const out = {};
  for (const m of modules) {
    for (const [k, v] of Object.entries(m || {})) {
      if (Object.prototype.hasOwnProperty.call(out, k)) {
        throw new Error(`[SQL Rooms] Duplicate key detected: "${k}"`);
      }
      out[k] = v;
    }
  }
  return out;
}

module.exports = mergeNoDup(
  require("./rooms.sql.js"),
  require("./roomTypes.sql.js"),
  require("./amenities.sql.js"),
  require("./roomAmenities.sql.js")
);
