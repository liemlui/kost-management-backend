// backend/src/shared/parsers.js
// Shared, reusable parsing helpers (no req/res, no DB).
// NOTE: This file is allowed to include "select placeholder" handling (e.g. "false")
// because you explicitly want all shareable helpers centralized.

function toNullIfEmpty(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  return s;
}

function toIntOrNull(v) {
  const s = toNullIfEmpty(v);
  if (s === null) return null;

  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function toNumOrNull(v) {
  const s = toNullIfEmpty(v);
  if (s === null) return null;

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toNumOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toBool(v) {
  // checkbox HTML: undefined (unchecked) / "1" / "on" / "true" (checked)
  if (v === true || v === false) return v;
  if (v === null || v === undefined) return false;

  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "on" || s === "yes";
}

// Common <select> placeholder behavior in your UI:
// empty string OR "false" should be treated as null.
function toSelectIntOrNull(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "" || s.toLowerCase() === "false") return null;
  return toIntOrNull(s);
}

module.exports = {
  toNullIfEmpty,
  toIntOrNull,
  toNumOrNull,
  toNumOrZero,
  toBool,
  toSelectIntOrNull,
};
