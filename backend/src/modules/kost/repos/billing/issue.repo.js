const { query } = require("../../../../db/pool");
const sql = require("../../sql/billing");

function issueInvoiceForStay(stayId) {
  return query(
    sql.issueInvoiceForStay,
    [stayId],
    "kost.billing.issueInvoiceForStay"
  );
}

module.exports = { issueInvoiceForStay };
