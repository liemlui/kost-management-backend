// modules/kost/sql/billing/index.js
module.exports = {
  ...require("./credits.sql"),
  ...require("./deposits.sql"),
  ...require("./invoices.sql"),
  ...require("./payments.sql"),
};
