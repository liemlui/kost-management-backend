const repo = require("../../repos/billing/issue.repo");

async function issueForStay(stayId) {
  const res = await repo.issueInvoiceForStay(stayId);
  // expect 1 row
  return res.rows[0];
}

module.exports = { issueForStay };
