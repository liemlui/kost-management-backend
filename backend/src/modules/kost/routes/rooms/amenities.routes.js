const express = require("express");
const router = express.Router();

const amenitiesController = require("../../controllers/rooms/amenities.controller");

/**
 * Master Amenities CRUD
 * Base path: /admin/kost/amenities
 */
router.get("/", amenitiesController.listAmenities);
router.get("/new", amenitiesController.newAmenityForm);
router.post("/", amenitiesController.createAmenity);

router.get("/:id/edit", amenitiesController.editAmenityForm);
router.post("/:id", amenitiesController.updateAmenity);

router.post("/:id/toggle", amenitiesController.toggleAmenityActive);

module.exports = router;
