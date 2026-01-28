const express = require("express");
const controller = require("../../controllers/inventory/inventoryAnalytics.controller");

const router = express.Router();
router.get("/", controller.index);

module.exports = router;
