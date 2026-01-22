// modules/kost/routes/index.js
const express = require("express");
const router = express.Router();

const roomsRoutes = require("./rooms/rooms.routes");
const roomTypesRoutes = require("./rooms/roomTypes.routes");
const amenitiesRoutes = require("./rooms/amenities.routes");
const roomAmenitiesRoutes = require("./rooms/roomAmenities.routes");

const tenantsRoutes = require("./tenants/tenants.routes");
const staysRoutes = require("./stays/stays.routes");


router.use("/rooms", roomsRoutes);
router.use("/room-types", roomTypesRoutes);
router.use("/amenities", amenitiesRoutes);
router.use("/rooms/:id/amenities", roomAmenitiesRoutes);


router.use("/tenants", tenantsRoutes);
router.use("/stays", staysRoutes);

module.exports = router;
