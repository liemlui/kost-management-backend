const express = require("express");
const roomsController = require("../../controllers/rooms/rooms.controller");
//const assetsController = require("../../controllers/assets/roomAssets.controller");

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

// // Room Assets (nested under room)
// router.get("/:id/assets", assetsController.index);
// router.get("/:id/assets/new", assetsController.showNewForm);
// router.post("/:id/assets", assetsController.create);
// // ... tambahkan routes asset lainnya sesuai kebutuhan

module.exports = router;