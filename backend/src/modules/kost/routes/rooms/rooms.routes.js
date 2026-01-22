// modules/kost/routes/rooms/rooms.routes.js
const express = require("express");
const roomsController = require("../../controllers/rooms/rooms.controller");

const router = express.Router();

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


module.exports = router;
