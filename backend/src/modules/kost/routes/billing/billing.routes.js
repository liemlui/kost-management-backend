// pwe/backend/src/modules/kost/routes/billing/billing.routes.js
const express = require("express");
const router = express.Router();
const c = require("../../controllers/billing/billing.controller");

// Board
router.get("/", c.list);

// Admin tool (optional)
router.post("/generate-draft", c.generateDraft);

// ✅ Issue from board (stay → invoice)
router.post("/stays/:stayId/issue", c.issueStay);

// Invoice detail actions
router.get("/:id", c.detail);
router.post("/:id/meter", c.captureMeter);
router.post("/:id/issue", c.issueInvoice);

module.exports = router;
