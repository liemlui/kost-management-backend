const express = require("express");
const controller = require("../../controllers/inventory/inventoryMovements.controller");

const router = express.Router();

router.get("/", controller.index);

router.get("/new", controller.showNewForm);
router.post("/", controller.create);

module.exports = router;
