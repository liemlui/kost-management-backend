const express = require("express");
const controller = require("./kost.controller");

const router = express.Router();

// rooms
router.get("/rooms", controller.listRooms);
router.get("/rooms/new", controller.newRoomForm);
router.post("/rooms", controller.createRoom);
// tenants
router.get("/tenants", controller.listTenants);
router.get("/tenants/new", controller.newTenantForm);
router.post("/tenants", controller.createTenant);
// stays
router.get("/stays", controller.listStays);
router.get("/stays/new", controller.newStayForm);
router.post("/stays", controller.createStay);
router.post("/stays/:id/end", controller.endStay);
// invoices
router.get("/invoices", controller.listInvoices);
router.get("/invoices/:id", controller.viewInvoice);
router.post('/invoices/:id/issue', kostController.issueInvoice);
// payments
router.get("/payments", controller.listPayments);
router.post('/payments/:id/verify', kostController.verifyPayment);

module.exports = router;
