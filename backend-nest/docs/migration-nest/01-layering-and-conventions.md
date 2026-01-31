# 01 — Layering & Conventions (NestJS + EJS)

## 1) Layer Responsibilities (Strict)
Order:
SQL → Repo → Service (optional) → Controller → View

### 1.1 SQL Layer (SSOT)
Path:
- backend-nest/src/modules/<domain>/sql/**

Rules:
- SQL strings only.
- No duplicate keys in exported query maps.
- Naming:
  list*, get*, insert*, update*, delete*, toggle*, lookup*
- Must align with kost_schema.sql constraints and enums.

### 1.2 Repo Layer (DB access only)
Path:
- backend-nest/src/modules/<domain>/repos/**

Rules:
- Executes SQL from SQL layer using db pool.
- No formatting, no flash, no business rules.
- No cross-domain drift.

### 1.3 Service Layer (Optional)
Path:
- backend-nest/src/modules/<domain>/services/**

Only create when:
- orchestration across multiple repos is needed
- transaction boundary is needed
- reusable business rule used by >1 controller

If it only wraps one repo call, remove it.

### 1.4 Controller Layer (Thin + View Model)
Path:
- backend-nest/src/modules/<domain>/controllers/**

Rules:
- Parse inputs via shared parsers.
- Call repo/service.
- Build view model (derived fields allowed, formatting not allowed).
- Set flash + redirect/render.

### 1.5 View Layer (EJS) Render-only
Path:
- backend-nest/src/views/**

Allowed:
- loops for rendering tables
- simple conditions for display

Not allowed:
- defining helper functions inside views
- calculating business rules inside views

## 2) Formatting Helpers (View-only)
Path:
- backend-nest/src/views/kost/partials/helpers.ejs

Only formatting:
- fmtIDR, fmtDate, badge helpers
No data fetching and no business rules.

## 3) Flash Contract (SSOT)
Shared:
- backend-nest/src/shared/flash.ts

Views read:
- flash.success, flash.error, flash.errors[], flash.form

Controllers write only via flash helper functions.

## 4) Input Parsing (SSOT)
Shared:
- backend-nest/src/shared/parsers.ts

Controllers must not do:
- Number(), parseInt()
- req.body.x || null
- manual checkbox conversions

## 5) Naming Consistency
- Use one naming style across layers:
  rooms.controller.ts, rooms.service.ts, rooms.repo.ts, rooms.sql.ts
- Route prefix consistency:
  /admin/kost/rooms
  /admin/kost/room-types
  /admin/kost/tenants
  /admin/kost/stays
