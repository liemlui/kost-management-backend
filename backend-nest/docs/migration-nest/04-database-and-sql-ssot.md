# 04 — Database & SQL SSOT

## 1) Database Source of Truth
- kost_schema.sql is the authoritative schema reference.
- Any schema change must be reflected by updating kost_schema.sql (or migration files, if used later).

## 2) SQL Rules
- All query strings live in *.sql.ts files.
- Repo imports queries from SQL layer only.
- Use parameterized queries always ($1, $2, ...).
- Prefer doing heavy aggregation in SQL, not in controller/view.

## 3) Transaction Guidelines
Use transactions in Service layer only when needed:
- Create stay + create deposit movement
- Inventory movement + balance update
- Invoice create + invoice items create

If it’s a single insert/update, keep it in Repo without a Service.

## 4) Performance Notes
- Add indexes only when real queries demand it.
- Always align indexes with real filter patterns (status, dates, foreign keys).
