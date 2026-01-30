// backend/src/modules/kost/routes/stays/stays.routes.js
const express = require("express");
const router = express.Router();

const staysController = require("../../controllers/stays/stays.controller");

// Pages (render)
router.get("/", staysController.index);
router.get("/new", staysController.showNew);
router.get("/:id", staysController.detail);

// Actions
router.post("/", staysController.create);

// ✅ Preferred term: Checkout
router.post("/:id/checkout", staysController.checkout);

// ✅ Backward-compatible alias (optional; keep if you still have old links/forms)
router.post("/:id/physical-checkout", staysController.checkout);
router.post("/:id/end", staysController.checkout);

module.exports = router;
