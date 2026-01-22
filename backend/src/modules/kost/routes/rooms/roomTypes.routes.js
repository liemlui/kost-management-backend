// modules/kost/routes/rooms/roomTypes.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/rooms/roomTypes.controller");

router.get("/", ctrl.list);
router.get("/new", ctrl.showNew);
router.post("/", ctrl.create);
router.get("/:id/edit", ctrl.showEdit);
router.post("/:id", ctrl.update);

module.exports = router;
