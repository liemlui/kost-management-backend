// src/shared/ids.js

/**
 * Validate and normalize an id to positive integer.
 * - Accepts string/number.
 * - Throws an error with status=400 for invalid input.
 */
function assertPositiveInt(value, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`Invalid id for ${label}: ${value}`);
    err.status = 400;
    throw err;
  }
  return n;
}

module.exports = { assertPositiveInt };