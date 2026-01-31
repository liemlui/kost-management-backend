# 05 — Logging & Debugging

Goal: easy trace for solo dev.

## 1) Logging Principles
- Log at controller entry for write actions (create/update/delete/toggle).
- Log DB error with context: module, action, key IDs.
- Don’t log secrets or full request bodies containing sensitive info.

## 2) Minimal log fields
- action: "rooms.create", "tenants.update"
- user_id (if available)
- entity_id (room_id, tenant_id, etc.)
- status: success/fail
- error message (sanitized)

## 3) Error Handling
- Centralize HTTP errors (not scattered throw strings).
- Controllers catch and convert errors to flash + redirect where needed.
