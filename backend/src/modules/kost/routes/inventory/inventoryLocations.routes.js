const express = require("express");
const controller = require("../../controllers/inventory/inventoryLocations.controller");

const router = express.Router();

router.get("/", controller.index);

router.get("/new", controller.showNewForm);
router.post("/", controller.create);

router.get("/:id/edit", controller.showEditForm);
router.post("/:id", controller.update);

router.post("/:id/delete", controller.remove);

module.exports = router;
