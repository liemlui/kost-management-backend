# 02 — Migration Plan (Module 03)

## Phase A — Make it run (EJS SSR)
Goal: Nest app boots, serves EJS + static assets, connects to DB, basic admin pages render.

Milestone A1:
- Nest bootstrap + EJS rendering + static
- Request logging + error handling baseline
- DB pool working

Milestone A2 (feature-by-feature porting order):
1) Rooms
2) Room Types
3) Tenants
4) Stays
5) Inventory
6) Billing
7) Assets

Rule:
- Move one feature until stable, then lock.
- Keep commits small and reviewable.

## Phase B — React incremental (optional)
Only convert pages that become complex:
- Rooms list (filters/paging/inline actions)
- Room detail (tabs/assets/dynamic forms)
- Billing board
- Inventory movements

Backend remains Nest; React consumes internal APIs.

## Definition of Done (per feature)
- SQL in SQL layer only
- Repo is DB access only
- Controller thin, view model prepared
- EJS render-only
- Logs exist on key actions
- Errors handled consistently
