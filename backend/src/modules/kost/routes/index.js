// modules/kost/routes/index.js
const express = require("express");
const router = express.Router();

const roomsRoutes = require("./rooms/rooms.routes");
const roomTypesRoutes = require("./rooms/roomTypes.routes");
const amenitiesRoutes = require("./rooms/amenities.routes");
const roomAmenitiesRoutes = require("./rooms/roomAmenities.routes");

const tenantsRoutes = require("./tenants/tenants.routes");
const staysRoutes = require("./stays/stays.routes");
const billingRoutes = require("./billing/billing.routes");
const inventoryItemsRoutes = require("./inventory/inventoryItems.routes");
const inventoryMovementsRoutes = require("./inventory/inventoryMovements.routes");
const inventoryAnalyticsRoutes = require("./inventory/inventoryAnalytics.routes");
const inventoryLocationsRoutes = require("./inventory/inventoryLocations.routes");
const inventoryBalancesRoutes = require("./inventory/inventoryBalances.routes");

const assetsRoutes = require("./assets/assets.routes");

router.get("/", (req, res) => {
  res.redirect("/admin/kost/rooms");
});

router.use("/inventory/balances", inventoryBalancesRoutes);

router.use("/inventory/locations", inventoryLocationsRoutes);
router.use("/inventory/analytics", inventoryAnalyticsRoutes);

router.use("/inventory/items", inventoryItemsRoutes);
router.use("/inventory/movements", inventoryMovementsRoutes);

router.use("/rooms", roomsRoutes);
router.use("/rooms", assetsRoutes);

router.use("/room-types", roomTypesRoutes);
router.use("/amenities", amenitiesRoutes);
router.use("/rooms/:id/amenities", roomAmenitiesRoutes);

router.use("/billing", billingRoutes);

router.use("/tenants", tenantsRoutes);
router.use("/stays", staysRoutes);

module.exports = router;
