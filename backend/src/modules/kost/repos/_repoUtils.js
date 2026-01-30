// modules/kost/repos/_repoUtils.js
function assertId(id, label) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`Invalid id for ${label}: ${id}`);
    err.status = 400;
    throw err;
  }
  return n;
}

function assertNullableId(id, label) {
  if (id === null || id === undefined || id === "") return null;
  return assertId(id, label);
}

module.exports = { assertId, assertNullableId };
