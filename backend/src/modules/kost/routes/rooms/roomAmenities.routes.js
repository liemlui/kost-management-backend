const express = require("express");
const router = express.Router({ mergeParams: true });

const c = require("../../controllers/rooms/roomAmenities.controller");

// Base path (mounted): /admin/kost/rooms/:id/amenities
router.get("/", c.manageRoomAmenities);
router.post("/", c.addRoomAmenity);
router.post("/:roomAmenityId", c.updateRoomAmenity);
router.post("/:roomAmenityId/delete", c.deleteRoomAmenity);

module.exports = router;
