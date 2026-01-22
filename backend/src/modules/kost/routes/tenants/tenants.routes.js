// modules/kost/routes/tenants/tenants.routes.js
const express = require("express");
const router = express.Router();

const tenantsController = require("../../controllers/tenants/tenants.controller");

// UI pages (render)
router.get("/", tenantsController.renderTenantsList);
router.get("/new", tenantsController.renderTenantNewForm);
router.post("/", tenantsController.createTenant);

// detail & edit
router.get("/:id", tenantsController.renderTenantDetail);
router.get("/:id/edit", tenantsController.renderTenantEditForm);
router.post("/:id", tenantsController.updateTenant);

// soft active toggle
router.post("/:id/toggle-active", tenantsController.toggleTenantActive);

module.exports = router;
