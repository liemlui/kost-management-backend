// pwe/backend/src/modules/kost/repos/billing/invoice.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql/billing");

function listInvoices(status = null) {
  return query(sql.listInvoices, [status], "kost.billing.listInvoices");
}

function getInvoice(invoiceId) {
  return query(sql.getInvoice, [invoiceId], "kost.billing.getInvoice");
}

function listInvoiceItems(invoiceId) {
  return query(sql.listInvoiceItems, [invoiceId], "kost.billing.listInvoiceItems");
}

function getInvoiceElectricity(invoiceId) {
  return query(sql.getInvoiceElectricity, [invoiceId], "kost.billing.getInvoiceElectricity");
}

// ✅ ADD: DRAFT → ISSUED (by invoice id)
function issueInvoice(invoiceId) {
  return query(
    sql.issueInvoice,              // 🔥 ini harus ada di invoices.sql.js (flat)
    [invoiceId],
    "kost.billing.issueInvoice"
  );
}

module.exports = {
  listInvoices,
  getInvoice,
  listInvoiceItems,
  getInvoiceElectricity,
  issueInvoice, // ✅ export
};
