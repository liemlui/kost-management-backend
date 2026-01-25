// pwe/backend/src/modules/kost/sql/billing/index.js

const generator = require("./generator.sql");
const invoices = require("./invoices.sql");
const electricity = require("./electricity.sql");

module.exports = { generator, invoices, electricity };
