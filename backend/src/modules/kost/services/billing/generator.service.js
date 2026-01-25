// pwe/backend/src/modules/kost/services/billing/generator.service.js

const repo = require("../../repos/billing/generator.repo");
async function generateDraft() {
  return repo.generateDraft();
}
module.exports = { generateDraft };
