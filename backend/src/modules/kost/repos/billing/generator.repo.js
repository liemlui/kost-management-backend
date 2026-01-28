// pwe/backend/src/modules/kost/repos/billing/generator.repo.js
const { query } = require("../../../../db/pool");
const sql = require("../../sql/billing");

function generateDraft() {
  return query(sql.generator.generateDraft, [], "kost.billing.generateDraft");
}

module.exports = { generateDraft };
