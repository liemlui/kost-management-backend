// src/shared/phone.js

function normalizePhoneTo62(raw) {
  if (!raw) return null;

  let s = String(raw).trim().replace(/\s+/g, "");

  if (s.startsWith("+62")) s = s.slice(1);
  if (s.startsWith("0")) s = "62" + s.slice(1);

  return s;
}

module.exports = {
  normalizePhoneTo62,
};
