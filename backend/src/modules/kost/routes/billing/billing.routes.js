// pwe/backend/src/modules/kost/routes/billing/billing.routes.js
const express = require("express");
const router = express.Router();
const c = require("../../controllers/billing/billing.controller");

router.get("/", c.list);
router.post("/generate-draft", c.generateDraft);
router.get("/:id", c.detail);
router.post("/:id/meter", c.captureMeter);
router.post("/:id/issue", c.issueInvoice);


module.exports = router;
