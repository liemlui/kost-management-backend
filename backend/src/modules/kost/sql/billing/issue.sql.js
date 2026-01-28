// modules/kost/sql/billing/issue.sql.js
module.exports = {
  // Issue invoice for a stay for the next billing due date (based on billing_anchor_day)
  // Idempotent: if invoice already exists for that (stay_id, due_date), it will return existing invoice.
  issueInvoiceForStay: `
    WITH base AS (
      SELECT
        s.id AS stay_id,
        s.status,
        s.billing_anchor_day,
        s.rent_period,
        s.base_rent_amount,
        s.discount_amount,
        s.additional_rent_amount,
        s.deposit_amount,

        (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date AS last_day_this_month,
        (date_trunc('month', CURRENT_DATE) + interval '2 month - 1 day')::date AS last_day_next_month
      FROM kost.stays s
      WHERE s.id = $1
      FOR UPDATE
    ),
    guards AS (
      SELECT *
      FROM base
      WHERE status = 'ACTIVE'
    ),
    due_calc AS (
      SELECT
        *,
        (date_trunc('month', CURRENT_DATE)::date
          + (LEAST(billing_anchor_day, EXTRACT(day FROM last_day_this_month)::int) - 1)
        )::date AS due_this_month
      FROM guards
    ),
    next_due AS (
      SELECT
        *,
        CASE
          WHEN due_this_month >= CURRENT_DATE THEN due_this_month
          ELSE (
            date_trunc('month', CURRENT_DATE + interval '1 month')::date
            + (LEAST(billing_anchor_day, EXTRACT(day FROM last_day_next_month)::int) - 1)
          )::date
        END AS due_date_final
      FROM due_calc
    ),
    inv_insert AS (
      INSERT INTO kost.invoices (
        stay_id,
        invoice_number,
        period_start,
        period_end,
        due_date,
        total_amount,
        status,
        created_at,
        updated_at,
        issued_at
      )
      SELECT
        stay_id,
        -- simple DEV invoice number (you can replace with your generator later)
        ('ISS-' || stay_id::text || '-' || to_char(CURRENT_DATE, 'YYYYMMDD')) AS invoice_number,
        -- period_start: today for now (simple). Later can be computed start-of-period.
        CURRENT_DATE AS period_start,
        due_date_final AS period_end,
        due_date_final AS due_date,
        0::numeric AS total_amount,
        'ISSUED' AS status,
        now(),
        now(),
        now()
      FROM next_due
      ON CONFLICT (stay_id, due_date) DO NOTHING
      RETURNING id, stay_id, due_date
    ),
    inv AS (
      -- get invoice id: from insert OR existing
      SELECT id, stay_id, due_date
      FROM inv_insert
      UNION ALL
      SELECT i.id, i.stay_id, i.due_date
      FROM kost.invoices i
      JOIN next_due n ON n.stay_id = i.stay_id AND i.due_date = n.due_date_final
      LIMIT 1
    ),
    rent_item AS (
      INSERT INTO kost.invoice_items (invoice_id, item_type, description, qty, unit_price, amount)
      SELECT
        inv.id,
        'RENT',
        'Room rent',
        1,
        (COALESCE(s.base_rent_amount, 0) - COALESCE(s.discount_amount, 0) + COALESCE(s.additional_rent_amount, 0)),
        (COALESCE(s.base_rent_amount, 0) - COALESCE(s.discount_amount, 0) + COALESCE(s.additional_rent_amount, 0))
      FROM inv
      JOIN kost.stays s ON s.id = inv.stay_id
      ON CONFLICT DO NOTHING
      RETURNING invoice_id
    ),
    deposit_item AS (
      -- insert deposit once per stay: only if no DEPOSIT item ever exists for this stay
      INSERT INTO kost.invoice_items (invoice_id, item_type, description, qty, unit_price, amount)
      SELECT
        inv.id,
        'DEPOSIT',
        'Deposit',
        1,
        COALESCE(s.deposit_amount, 0),
        COALESCE(s.deposit_amount, 0)
      FROM inv
      JOIN kost.stays s ON s.id = inv.stay_id
      WHERE COALESCE(s.deposit_amount, 0) > 0
        AND NOT EXISTS (
          SELECT 1
          FROM kost.invoice_items ii
          JOIN kost.invoices i2 ON i2.id = ii.invoice_id
          WHERE i2.stay_id = s.id
            AND ii.item_type = 'DEPOSIT'
        )
      RETURNING invoice_id
    ),
    totals AS (
      UPDATE kost.invoices i
      SET
        total_amount = COALESCE((
          SELECT SUM(amount)
          FROM kost.invoice_items
          WHERE invoice_id = i.id
        ), 0),
        updated_at = now()
      WHERE i.id = (SELECT id FROM inv)
      RETURNING i.*
    )
    SELECT * FROM totals;
  `,
};
