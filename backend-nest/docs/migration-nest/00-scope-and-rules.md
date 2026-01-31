# 00 — Scope & Rules (Migration NestJS + TypeScript)

Project: Personal Web Ecosystem
Focus: Module 03 (Kost Admin)
Database: SINGLE PostgreSQL using kost_schema.sql as schema SSOT

## 1) Scope
We are migrating Module 03 (Kost Admin) to:
- NestJS + TypeScript
- Phase A UI: EJS SSR (fast, stable)
- Phase B UI: React incremental for highly interactive admin pages (optional)

Legacy backend stays as reference until new app is stable:
- backend/ (legacy Express)
- backend-nest/ (new NestJS)

## 2) Non-negotiable Rules
1) Modular Monolith:
- One backend app, one DB.
- Domain separated by module folders and DB schema boundaries.

2) Database:
- Keep using existing PostgreSQL and kost_schema.sql.
- No new DB per module.

3) Finance SSOT:
- Financial reporting must come from finance ledger (when finance schema exists).
- Operational modules store operational facts, not financial truth totals.

4) Layering (strict):
SQL (SSOT) → Repo (DB access only) → Service (optional) → Controller (thin) → View (render only)

5) Views:
- EJS is render-only.
- No helper duplication in views.
- No business calculation in views.

6) Parsing:
- Controller must use shared parsers (no manual Number/parseInt/checkbox conversions).

## 3) “Keep Chat In Context” Rules
When discussing changes:
- Always mention: module, file path, and layer (SQL/Repo/Service/Controller/View).
- Avoid broad refactors that touch unrelated modules.
- Prefer small safe commits.
