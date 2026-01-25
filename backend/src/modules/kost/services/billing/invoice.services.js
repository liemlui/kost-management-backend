// pwe/backend/src/modules/kost/services/billing/invoice.services.js
const invoicesRepo = require("../../repos/billing/invoice.repo");
async function issueInvoice(invoiceId, actorUserId) {
  const res = await invoicesRepo.issueInvoice(invoiceId);

  if (res.rowCount === 0) {
    const err = new Error("Invoice not in DRAFT or not found");
    err.status = 400;
    throw err;
  }

  return res.rows[0];
}

module.exports = {

  issueInvoice,
};
