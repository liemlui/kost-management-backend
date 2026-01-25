// pwe/backend/src/modules/kost/sql/billing/invoices.sql.js
module.exports = {
  listInvoices: `
SELECT
  i.id,
  i.invoice_number,
  i.status,
  i.period_start,
  i.period_end,
  i.due_date,
  i.total_amount,
  i.created_at,
  s.room_id,
  t.full_name AS tenant_name
FROM kost.invoices i
JOIN kost.stays s ON s.id = i.stay_id
JOIN kost.tenants t ON t.id = s.tenant_id
WHERE ($1::text IS NULL OR i.status = $1::text)
ORDER BY i.id DESC
LIMIT 200;
  `,
  getInvoice: `
SELECT
  i.*,
  s.room_id,
  s.tenant_id,
  t.full_name AS tenant_name
FROM kost.invoices i
JOIN kost.stays s ON s.id = i.stay_id
JOIN kost.tenants t ON t.id = s.tenant_id
WHERE i.id = $1::bigint;
  `,
  listInvoiceItems: `
SELECT *
FROM kost.invoice_items
WHERE invoice_id = $1::bigint
ORDER BY item_type;
  `,
  getInvoiceElectricity: `
SELECT *
FROM kost.invoice_electricity
WHERE invoice_id = $1::bigint;
  `,
 issueInvoice: `
    UPDATE kost.invoices
    SET
      status = 'ISSUED',
      issued_at = COALESCE(issued_at, now()),
      -- fallback due_date kalau kosong: pakai period_start (atau now)
      due_date = COALESCE(due_date, period_start, CURRENT_DATE),
      updated_at = now()
    WHERE id = $1
      AND status = 'DRAFT'
    RETURNING id, status, issued_at, due_date;
  `,

};
