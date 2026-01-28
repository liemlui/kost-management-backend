module.exports = {
  ...require("./generator.sql.js"),
  ...require("./invoices.sql.js"),
  ...require("./electricity.sql.js"),
  ...require("./board.sql.js"), // 🔥 FIX
  ...require("./issue.sql.js"),
};
