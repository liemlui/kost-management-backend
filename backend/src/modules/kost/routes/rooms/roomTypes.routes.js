const express = require("express");
const router = express.Router();

const ctrl = require("../../controllers/rooms/roomTypes.controller");

/**
 * Room Types CRUD
 * Base path: /admin/kost/room-types
 */
router.get("/", ctrl.list);
router.get("/new", ctrl.showNew);
router.post("/", ctrl.create);

router.get("/:id/edit", ctrl.showEdit);
router.post("/:id", ctrl.update);

router.post("/:id/toggle-active", ctrl.toggleActive);

module.exports = router;
