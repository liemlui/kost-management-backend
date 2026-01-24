// modules/kost/routes/stays/stays.routes.js
const express = require("express");
const router = express.Router();

const staysController = require("../../controllers/stays/stays.controller");

// Pages (render)
router.get("/", staysController.renderStaysList);
router.get("/new", staysController.renderStayNewForm);
router.get("/:id", staysController.renderStayDetail);

// Actions
router.post("/", staysController.createStay);

// ✅ Preferred term: Checkout
router.post("/:id/checkout", staysController.checkoutStay);
router.post("/:id/physical-checkout", staysController.markPhysicalCheckout);

// ✅ Backward-compatible alias (jaga-jaga masih ada link lama)
router.post("/:id/end", staysController.endStay);

module.exports = router;
