// modules/kost/routes/stays/stays.routes.js
const express = require("express");
const router = express.Router();

const staysController = require("../../controllers/stays/stays.controller");

// UI pages (render)
router.get("/", staysController.renderStaysList);
router.get("/new", staysController.renderStayNewForm);
router.get("/:id", staysController.renderStayDetail);

// Actions (POST)
router.post("/", staysController.createStay);
router.post("/:id/checkout", staysController.endStay);

module.exports = router;
