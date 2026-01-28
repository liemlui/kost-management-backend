// modules/kost/routes/inventory/inventoryBalances.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../../controllers/inventory/inventoryBalances.controller");

router.get("/", controller.index);

module.exports = router;
