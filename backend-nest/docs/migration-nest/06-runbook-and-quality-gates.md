# 06 — Runbook & Quality Gates (backend-nest)

## 1) Environment
Required env:
- DATABASE_URL
- SESSION_SECRET
- PORT

## 2) Scripts (recommended)
- dev: start in watch mode
- build: compile TS
- start: run dist
- typecheck: tsc --noEmit
- lint: optional later

## 3) Quality Gates before marking “LOCKED”
- App boots (no runtime error)
- Core pages render
- DB connectivity OK
- Typecheck passes
- No SQL duplicated outside SQL layer
- Views contain no helper duplication
