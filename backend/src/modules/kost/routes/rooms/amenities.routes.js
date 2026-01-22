// modules/kost/routes/rooms/amenities.routes.js
const express = require("express");
const router = express.Router();

// controller
const amenitiesController = require("../../controllers/rooms/amenities.controller");

/**
 * Master Amenities CRUD
 * Base path: /admin/kost/amenities
 */

// list
router.get("/", amenitiesController.listAmenities);

// create
router.get("/new", amenitiesController.newAmenityForm);
router.post("/", amenitiesController.createAmenity);

// edit
router.get("/:id/edit", amenitiesController.editAmenityForm);
router.post("/:id", amenitiesController.updateAmenity);

// toggle active / inactive
router.post("/:id/toggle", amenitiesController.toggleAmenityActive);

module.exports = router;
