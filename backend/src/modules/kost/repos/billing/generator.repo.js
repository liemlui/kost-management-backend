const sql = require("../../sql/billing");

function generateDraft() {
  return query(sql.generator.generateDraft, [], "kost.billing.generateDraft");
}
