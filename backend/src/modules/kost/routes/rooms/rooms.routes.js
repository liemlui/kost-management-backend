const express = require("express");
const roomsController = require("../../controllers/rooms/rooms.controller");

const roomAmenitiesRoutes = require("./roomAmenities.routes");
// OPTIONAL kalau assets memang ada:
// const assetsRoutes = require("../assets/assets.routes");

const router = express.Router();

// Rooms CRUD
router.get("/", roomsController.index);
router.get("/new", roomsController.showNewForm);
router.post("/", roomsController.create);

router.get("/:id", roomsController.detail);
router.get("/:id/edit", roomsController.showEditForm);
router.post("/:id", roomsController.update);

router.post("/:id/delete", roomsController.remove);
router.post("/:id/block", roomsController.block);
router.post("/:id/unblock", roomsController.unblock);
router.post("/:id/change-type", roomsController.changeRoomType);

// ✅ Nested: Room Amenities
// Base path: /admin/kost/rooms/:id/amenities
router.use("/:id/amenities", roomAmenitiesRoutes);

// ✅ Nested: Room Assets (kalau modul assets sudah siap)
// Base path: /admin/kost/rooms/:id/assets
// router.use("/:id/assets", assetsRoutes);

module.exports = router;
