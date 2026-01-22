// modules/kost/services/ops/overdue.service.js
const overdueRepo = require('../../repos/ops/overdue.repo');
const stayService = require('../stays/stay.service');

async function runHPlus7OverdueCheck({ actor_id }) {
  if (!actor_id) {
    throw new Error('actor_id is required');
  }

  const res = await overdueRepo.listOverdueStaysHPlus7();
  const candidates = res.rows;

  const results = {
    checked: candidates.length,
    forced: 0,
    skipped: 0,
    errors: [],
  };

  for (const row of candidates) {
    try {
      await stayService.forcedCheckout({
        stay_id: row.stay_id,
        actor_id,
        reason: `H+7 overdue (invoice ${row.invoice_id}, overdue ${row.days_overdue} days)`,
      });
      results.forced += 1;
    } catch (err) {
      // Jangan hentikan batch
      results.skipped += 1;
      results.errors.push({
        stay_id: row.stay_id,
        message: err.message,
      });
    }
  }

  return results;
}

module.exports = {
  runHPlus7OverdueCheck,
};
