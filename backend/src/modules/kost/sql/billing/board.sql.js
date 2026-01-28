// modules/kost/sql/billing/board.sql.js
module.exports = {
  listBillingBoard: `
    WITH base AS (
      SELECT
        s.id AS stay_id,
        s.tenant_id,
        s.room_id,
        s.billing_anchor_day,
        s.rent_period,
        s.planned_check_out_at,

        t.full_name AS tenant_name,
        r.code AS room_code,

        (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date AS last_day_this_month,
        (date_trunc('month', CURRENT_DATE) + interval '2 month - 1 day')::date AS last_day_next_month
      FROM kost.stays s
      JOIN kost.tenants t ON t.id = s.tenant_id
      JOIN kost.rooms r ON r.id = s.room_id
      WHERE s.status = 'ACTIVE'
    ),
    due_calc AS (
      SELECT
        *,
        (date_trunc('month', CURRENT_DATE)::date
          + (LEAST(billing_anchor_day, EXTRACT(day FROM last_day_this_month)::int) - 1)
        )::date AS due_this_month
      FROM base
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
        END AS next_due_date
      FROM due_calc
    ),
    with_invoice AS (
      SELECT
        n.*,
        i.id AS invoice_id,
        i.invoice_number,
        i.status AS invoice_status,
        i.period_start,
        i.period_end,
        i.due_date,
        i.total_amount
      FROM next_due n
      LEFT JOIN LATERAL (
        SELECT *
        FROM kost.invoices i
        WHERE i.stay_id = n.stay_id
          AND i.due_date = n.next_due_date
        ORDER BY i.id DESC
        LIMIT 1
      ) i ON true
    )
    SELECT
      stay_id,
      tenant_id,
      tenant_name,
      room_id,
      room_code,
      rent_period,
      planned_check_out_at,
      billing_anchor_day,
      next_due_date,
      (next_due_date - CURRENT_DATE) AS d_day,

      invoice_id,
      invoice_number,
      invoice_status,
      period_start,
      period_end,
      due_date,
      total_amount
    FROM with_invoice
    WHERE next_due_date BETWEEN (CURRENT_DATE - $1::int) AND (CURRENT_DATE + $2::int)
    ORDER BY next_due_date ASC, room_code ASC;
  `,
};
