const { query } = require("../../../../db/pool");
const sql = require("../../sql/billing");

function listBillingBoard(pastDays = 2, futureDays = 10) {

    return query(
    sql.listBillingBoard,
    [pastDays, futureDays],
    "kost.billing.board.list"
  );
}

module.exports = { listBillingBoard };
