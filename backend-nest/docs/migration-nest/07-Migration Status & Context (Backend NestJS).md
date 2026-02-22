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

Kita lanjut Module 03 — Kost Admin di backend-nest (NestJS + TS). Fokus: Rooms Smoke Test (Opsi A). Ini migrasi dari Express JS; legacy adalah SSOT. Database SSOT: kost_schema.sql. Layering: SQL → Repo → Controller → View (EJS). No ORM. No inline SQL.

Status saat ini:

Server running: http://localhost:3000

Rooms module sudah parity dengan legacy (controller + repo + sql + views).

Log system sudah OK (request_id, error handler, devtools well-known 204).

Tujuan chat ini:
Lakukan smoke test Rooms end-to-end dan pastikan:

semua endpoint berjalan

validasi & handling error sama seperti legacy

status transitions benar

UI render benar

DB constraint tidak error

logging tindakan CUD terbaca dan traceable

Routes Rooms:

GET /admin/kost/rooms

GET /admin/kost/rooms/new

POST /admin/kost/rooms

GET /admin/kost/rooms/:id

GET /admin/kost/rooms/:id/edit

POST /admin/kost/rooms/:id

POST /admin/kost/rooms/:id/delete

POST /admin/kost/rooms/:id/block

POST /admin/kost/rooms/:id/unblock

POST /admin/kost/rooms/:id/change-type
(opsional) POST /admin/kost/rooms/:id/activate

Mulai dengan menyusun checklist smoke test + expected result + query verifikasi DB.

Checklist Smoke Test Rooms (biar kamu langsung siap jalan di chat baru)
A. List page

Buka /admin/kost/rooms

Expected: page load, tabel tampil

Filter room_type_id bekerja (jika ada dropdown)

Klik satu room → ke detail

DB check (opsional):

tidak perlu query, cukup visual dulu.

B. Create flow

Buka /admin/kost/rooms/new

Submit kosong

Expected: error flash / error tampil, tidak insert

Submit valid room

Expected: redirect ke detail room baru

Submit dengan code yang sama

Expected: error 23505 → pesan “code sudah dipakai”, tidak insert

DB check (optional):

select id, code, status, room_type_id, floor, position_zone
from kost.rooms
order by id desc
limit 5;

C. Detail page + amenities

Buka detail room baru /admin/kost/rooms/:id

Expected: badge status benar

Section amenities tampil (walau kosong)

hasAC/hasFAN konsisten dengan amenities list

D. Edit flow

Buka /admin/kost/rooms/:id/edit

Ubah position_zone ke kosong ("")

Expected: save sukses (harus jadi NULL di DB)

Ubah floor ke nilai invalid (mis 3) via devtools

Expected: validation fail, tidak update

Ubah code ke existing code

Expected: 23505 handled

DB check:

select id, code, floor, position_zone, status, updated_at
from kost.rooms
where id = <ID>;

E. Status transitions

Block → /block

Expected: status MAINTENANCE

Unblock → /unblock

Expected: status AVAILABLE

Delete → /delete

Expected: status INACTIVE (soft delete), kembali ke list

DB check:

select id, code, status
from kost.rooms
where id = <ID>;

F. Change type

Change room_type_id via /change-type

Expected: updated room_type_id, redirect detail ?type_changed=1

Tidak ada occupancy check (sesuai legacy)