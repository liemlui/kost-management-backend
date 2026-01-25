// pwe/backend/src/modules/kost/repos/billing/invoice.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql/billing");

function listInvoices(status = null) {
  return query(sql.invoices.listInvoices, [status], "kost.billing.listInvoices");
}

function getInvoice(invoiceId) {
  return query(sql.invoices.getInvoice, [invoiceId], "kost.billing.getInvoice");
}

function listInvoiceItems(invoiceId) {
  return query(sql.invoices.listInvoiceItems, [invoiceId], "kost.billing.listInvoiceItems");
}

function getInvoiceElectricity(invoiceId) {
  return query(sql.invoices.getInvoiceElectricity, [invoiceId], "kost.billing.getInvoiceElectricity");
}
async function issueInvoice(invoiceId) {
  return query(
    sql.invoices.issueInvoice,
    [invoiceId],
    "kost.billing.issueInvoice"
  );
}
module.exports = { listInvoices, getInvoice, listInvoiceItems, getInvoiceElectricity, issueInvoice };
