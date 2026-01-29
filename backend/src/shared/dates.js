// src/shared/dates.js

function todayISO_WIB() {
  const now = new Date();
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const wib = new Date(now.getTime() + wibOffsetMs);
  return wib.toISOString().slice(0, 10); // YYYY-MM-DD
}

module.exports = {
  todayISO_WIB,
};
