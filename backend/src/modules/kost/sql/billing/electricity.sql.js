// pwe/backend/src/modules/kost/sql/billing/electricity.sql.js
module.exports = {
  insertReading: `
INSERT INTO kost.meter_readings (room_id, reading_at, meter_value_kwh, captured_by, note)
VALUES ($1::bigint, now(), $2::numeric, $3::bigint, $4::text)
RETURNING id;
  `,
  getInvoiceElectricityForUpdate: `
SELECT allowance_kwh, tariff_per_kwh, room_id
FROM kost.invoice_electricity
WHERE invoice_id = $1::bigint
FOR UPDATE;
  `,
  updateInvoiceElectricity: `
UPDATE kost.invoice_electricity
SET
  start_reading_id = $2::bigint,
  end_reading_id   = $3::bigint,
  start_kwh        = $4::numeric,
  end_kwh          = $5::numeric,
  kwh_used         = $6::numeric,
  overage_kwh      = $7::int,
  overage_amount   = $8::numeric,
  updated_at       = now()
WHERE invoice_id = $1::bigint;
  `,
  upsertOverageItem: `
INSERT INTO kost.invoice_items (invoice_id, item_type, description, qty, unit_price, amount)
VALUES ($1::bigint, 'ELECTRIC_OVERAGE', 'Electricity overage', 1, $2::numeric, $2::numeric)
ON CONFLICT (invoice_id, item_type)
DO UPDATE SET qty = 1, unit_price = EXCLUDED.unit_price, amount = EXCLUDED.amount;
  `,
  deleteOverageItem: `
DELETE FROM kost.invoice_items
WHERE invoice_id = $1::bigint AND item_type = 'ELECTRIC_OVERAGE';
  `,
  recalcInvoiceTotal: `
UPDATE kost.invoices i
SET total_amount = COALESCE(x.sum_amount, 0)
FROM (
  SELECT invoice_id, SUM(amount) AS sum_amount
  FROM kost.invoice_items
  WHERE invoice_id = $1::bigint
  GROUP BY invoice_id
) x
WHERE i.id = $1::bigint;
  `,
};
