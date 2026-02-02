# 07 — Migration Status & Context (Backend NestJS)

Project: Personal Web Ecosystem (PWE)  
Module Focus: 03 — Kost Admin  
Backend Path: backend-nest/  
Database: PostgreSQL (SSOT: kost_schema.sql)

---

## 1) Current Status (LOCKED ✅)

### 1.1 Backend Bootstrap
- NestJS + TypeScript successfully bootstrapped
- Entry point: `backend-nest/src/main.ts`
- Server runs without error
- Routes tested:
  - `/health` ✅
  - `/health/db` ✅ (PostgreSQL connected)

### 1.2 Database
- Database connection via `pg` Pool
- Config:
  - Env loader: `src/config/env.ts`
  - Pool: `src/db/pool.ts`
- DB schema is FINAL and treated as SSOT:
  - File: `kost_schema.sql`
- No ORM used (SQL-first approach)

### 1.3 Tooling & Strictness
- TypeScript strict mode enabled
- Decorators fixed (`experimentalDecorators`, `emitDecoratorMetadata`)
- `express-session` import fixed
- `pg` typings installed (`@types/pg`)
- No VS Code red warnings remaining (LOCKED)

---

## 2) Folder Structure (Current)
backend-nest/
src/
main.ts
app.module.ts
app.controller.ts
config/
  env.ts

db/
  pool.ts

shared/
  (empty — next step)

middlewares/
  (empty — next step)

modules/
  (not started yet)

views/
  pages/home.ejs

public/


---

## 3) Architectural Rules (Active)

### 3.1 Architecture Style
- Modular Monolith
- Single backend app
- Single PostgreSQL database
- Schema-per-domain (kost.*, finance.*, etc.)

### 3.2 Layering (STRICT)
Order:
SQL (SSOT) → Repo → Service (optional) → Controller → View

Rules:
- SQL lives only in SQL files
- Repo = DB access only
- Service only for orchestration / transactions
- Controller thin (parse, call, prepare view model)
- View (EJS) render-only, no business logic

### 3.3 Finance Rule (Reminder)
- Finance ledger is SINGLE SOURCE OF TRUTH
- Kost Admin MUST NOT calculate financial totals as truth
- All income/expense eventually posted to finance ledger

---

## 4) Migration Strategy (Agreed)

### Phase A — Stabilize Backend (Current Phase)
- NestJS + TS
- EJS SSR
- SQL-first
- Focus on correctness & maintainability

### Phase B — Optional UI Upgrade (Later)
- React only for highly interactive admin pages
- Backend API remains NestJS

---

## 5) Next Planned Steps (IN ORDER)

1. Create `src/shared/parsers.ts`
   - Centralized input parsing
   - No manual `Number()`, `parseInt()`, checkbox parsing in controllers

2. Create `src/shared/flash.ts`
   - Flash message SSOT

3. Create `src/middlewares/requestLogger.ts`
   - Minimal, structured logging

4. Start first real module: **Rooms**
   - SQL → Repo → Controller → View
   - Based strictly on `kost_schema.sql`

---

## 6) How to Resume in New Chat

When starting a new chat, say:

> “Kita lanjut migrasi backend-nest modul 03.  
> Status terakhir ada di `backend-nest/docs/00-migration-status.md`.  
> Backend sudah running & DB sudah connect.  
> Kita lanjut dari shared/parsers.ts.”

This prevents re-explaining setup and avoids architectural drift.
