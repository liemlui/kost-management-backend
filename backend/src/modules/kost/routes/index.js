const express = require("express");
const router = express.Router();

// Rooms & related
const roomsRoutes = require("./rooms/rooms.routes");
const roomTypesRoutes = require("./rooms/roomTypes.routes");
const amenitiesRoutes = require("./rooms/amenities.routes");

// Tenants & Stays
const tenantsRoutes = require("./tenants/tenants.routes");
const staysRoutes = require("./stays/stays.routes");

// Billing
const billingRoutes = require("./billing/billing.routes");

// Inventory
const inventoryItemsRoutes = require("./inventory/inventoryItems.routes");
const inventoryMovementsRoutes = require("./inventory/inventoryMovements.routes");
const inventoryAnalyticsRoutes = require("./inventory/inventoryAnalytics.routes");
const inventoryLocationsRoutes = require("./inventory/inventoryLocations.routes");
const inventoryBalancesRoutes = require("./inventory/inventoryBalances.routes");

// Middleware
const kostLocals = require("../middlewares/kostLocals.middleware");

// Apply kostLocals middleware to all routes in this router
router.use(kostLocals);

// Home redirect
router.get("/", (req, res) => {
  res.redirect("/admin/kost/rooms");
});

// ===== ROOMS & RELATED =====
router.use("/rooms", roomsRoutes);
router.use("/room-types", roomTypesRoutes);
router.use("/amenities", amenitiesRoutes);

// ===== TENANTS & STAYS =====
router.use("/tenants", tenantsRoutes);
router.use("/stays", staysRoutes);

// ===== BILLING =====
router.use("/billing", billingRoutes);

// ===== INVENTORY =====
router.use("/inventory/items", inventoryItemsRoutes);
router.use("/inventory/movements", inventoryMovementsRoutes);
router.use("/inventory/analytics", inventoryAnalyticsRoutes);
router.use("/inventory/locations", inventoryLocationsRoutes);
router.use("/inventory/balances", inventoryBalancesRoutes);

module.exports = router;
