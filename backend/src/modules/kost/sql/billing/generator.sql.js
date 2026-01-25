// pwe/backend/src/modules/kost/sql/billing/generator.sql.js

module.exports = {
  generateDraft: `
WITH active_stays AS (
  SELECT s.*
  FROM kost.stays s
  WHERE s.status = 'ACTIVE'
    AND s.check_out_at IS NULL
),
last_invoice AS (
  SELECT stay_id, MAX(period_end) AS last_period_end
  FROM kost.invoices
  WHERE status NOT IN ('VOID','CANCELLED')
  GROUP BY stay_id
),
next_period AS (
  SELECT
    s.id AS stay_id,
    s.rent_period,
    COALESCE(li.last_period_end, s.check_in_at)::date AS period_start,
    CASE
      WHEN s.rent_period = 'MONTHLY'
        THEN (COALESCE(li.last_period_end, s.check_in_at) + INTERVAL '1 month')::date
      WHEN s.rent_period = 'WEEKLY'
        THEN (COALESCE(li.last_period_end, s.check_in_at) + INTERVAL '7 days')::date
      WHEN s.rent_period = 'BIWEEKLY'
        THEN (COALESCE(li.last_period_end, s.check_in_at) + INTERVAL '14 days')::date
      WHEN s.rent_period = 'DAILY'
        THEN (COALESCE(li.last_period_end, s.check_in_at) + INTERVAL '1 day')::date
      ELSE
        (COALESCE(li.last_period_end, s.check_in_at) + INTERVAL '1 month')::date
    END AS period_end
  FROM active_stays s
  LEFT JOIN last_invoice li ON li.stay_id = s.id
),
windowed AS (
  SELECT *
  FROM next_period
  WHERE period_start >= CURRENT_DATE
    AND period_start < (CURRENT_DATE + INTERVAL '7 days')
),
ins AS (
  INSERT INTO kost.invoices (
    stay_id, invoice_number, period_start, period_end, due_date, status, total_amount
  )
  SELECT
    w.stay_id,
    'INV-' || w.stay_id || '-' || to_char(w.period_start,'YYYYMMDD'),
    w.period_start,
    w.period_end,
    w.period_start,
    'DRAFT',
    0
  FROM windowed w
  ON CONFLICT (stay_id, period_start, period_end) DO NOTHING
  RETURNING id AS invoice_id, stay_id
),
rent_item AS (
  INSERT INTO kost.invoice_items (invoice_id, item_type, description, qty, unit_price, amount)
  SELECT
    ins.invoice_id,
    'RENT',
    'Room rent',
    1,
    s.agreed_rent_amount,
    s.agreed_rent_amount
  FROM ins
  JOIN kost.stays s ON s.id = ins.stay_id
  WHERE NOT EXISTS (
    SELECT 1 FROM kost.invoice_items it
    WHERE it.invoice_id = ins.invoice_id AND it.item_type = 'RENT'
  )
  RETURNING invoice_id
),
deposit_item AS (
  INSERT INTO kost.invoice_items (invoice_id, item_type, description, qty, unit_price, amount)
  SELECT
    ins.invoice_id,
    'DEPOSIT',
    'Security deposit (one-time)',
    1,
    s.deposit_amount,
    s.deposit_amount
  FROM ins
  JOIN kost.stays s ON s.id = ins.stay_id
  WHERE s.deposit_amount > 0
    AND NOT EXISTS (
      SELECT 1
      FROM kost.invoices i2
      JOIN kost.invoice_items it2 ON it2.invoice_id = i2.id
      WHERE i2.stay_id = s.id
        AND it2.item_type = 'DEPOSIT'
        AND i2.status NOT IN ('VOID','CANCELLED')
    )
  RETURNING invoice_id
),
ensure_electricity AS (
  -- hanya untuk MONTHLY + METERED
  WITH tariff AS (
    SELECT price_per_kwh
    FROM kost.electricity_tariffs
    WHERE effective_from <= CURRENT_DATE
    ORDER BY effective_from DESC
    LIMIT 1
  )
  INSERT INTO kost.invoice_electricity (
    invoice_id, room_id, period_start, period_end, allowance_kwh, tariff_per_kwh, created_at
  )
  SELECT
    ins.invoice_id,
    s.room_id,
    i.period_start,
    i.period_end,
    30,
    (SELECT price_per_kwh FROM tariff),
    now()
  FROM ins
  JOIN kost.stays s ON s.id = ins.stay_id
  JOIN kost.invoices i ON i.id = ins.invoice_id
  WHERE s.rent_period = 'MONTHLY'
    AND s.electricity_mode = 'METERED'
  ON CONFLICT (invoice_id) DO NOTHING
  RETURNING invoice_id
),
recalc AS (
  UPDATE kost.invoices i
  SET total_amount = x.sum_amount
  FROM (
    SELECT invoice_id, SUM(amount) AS sum_amount
    FROM kost.invoice_items
    WHERE invoice_id IN (SELECT invoice_id FROM ins)
    GROUP BY invoice_id
  ) x
  WHERE i.id = x.invoice_id
  RETURNING i.id
)
SELECT invoice_id, stay_id FROM ins;
`,
};
