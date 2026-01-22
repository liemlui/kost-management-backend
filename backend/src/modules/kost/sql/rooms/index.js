// modules/kost/sql/rooms/index.js
module.exports = {
  ...require("./rooms.sql"),
  ...require("./roomTypes.sql"),
  ...require("./amenities.sql"),
  ...require("./roomAmenities.sql"),
};
