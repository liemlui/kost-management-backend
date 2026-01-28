// modules/kost/sql/rooms/index.js
module.exports = {
  ...require("./rooms.sql.js"),
  ...require("./roomTypes.sql.js"),
  ...require("./amenities.sql.js"),
  ...require("./roomAmenities.sql.js"),
};
