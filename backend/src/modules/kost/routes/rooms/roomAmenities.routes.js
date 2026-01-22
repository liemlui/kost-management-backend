// modules/kost/routes/rooms/roomAmenities.routes.js
const express = require("express");
const router = express.Router({ mergeParams: true });
const c = require("../../controllers/rooms/roomAmenities.controller");

router.get("/", c.manageRoomAmenities);
router.post("/", c.addRoomAmenity);
router.post("/:roomAmenityId", c.updateRoomAmenity);
router.post("/:roomAmenityId/delete", c.deleteRoomAmenity);

module.exports = router;
