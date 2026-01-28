// pwe/backend/src/modules/kost/routes/assets/assets.routes.js
const express = require("express");
const router = express.Router();

const c = require("../../controllers/assets/roomAssets.controller");

// Mounted at: /admin/kost/rooms
// Final URLs:
// GET    /admin/kost/rooms/:id/assets
// POST   /admin/kost/rooms/:id/assets
// POST   /admin/kost/rooms/:id/assets/:assetId/repair
// POST   /admin/kost/rooms/:id/assets/:assetId/back
// POST   /admin/kost/rooms/:id/assets/:assetId/remove

router.get("/:id/assets", c.page);
router.post("/:id/assets", c.assign);

router.post("/:id/assets/:assetId/repair", c.markRepair);
router.post("/:id/assets/:assetId/back", c.markBackToRoom);
router.post("/:id/assets/:assetId/remove", c.remove);

module.exports = router;
