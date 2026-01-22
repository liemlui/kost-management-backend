// modules/kost/sql/ops/overdue.sql.js
module.exports = {
  listOverdueStaysHPlus7: `
    SELECT
      s.id AS stay_id,
      s.room_id,
      s.tenant_id,
      i.id AS invoice_id,
      i.due_date,
      (CURRENT_DATE - i.due_date) AS days_overdue
    FROM kost.invoices i
    JOIN kost.stays s ON s.id = i.stay_id
    WHERE i.status IN ('ISSUED', 'OVERDUE', 'UNDERPAID')
      AND i.due_date <= CURRENT_DATE - INTERVAL '7 days'
      AND s.status = 'ACTIVE'
    ORDER BY i.due_date ASC;
  `,
};
