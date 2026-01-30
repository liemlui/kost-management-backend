// src/modules/kost/repos/_repoUtils.js
const { assertPositiveInt } = require("../../shared/ids");

function assertId(id, label) {
  return assertPositiveInt(id, label);
}

function assertNullableId(id, label) {
  if (id === null || id === undefined || id === "") return null;
  return assertId(id, label);
}

module.exports = { assertId, assertNullableId };
