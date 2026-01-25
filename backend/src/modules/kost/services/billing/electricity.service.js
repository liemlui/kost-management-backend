// pwe/backend/src/modules/kost/services/billing/electricity.service.js

const repo = require("../../repos/billing/electricity.repo");

async function captureMeter(payload) {
  const { startKwh, endKwh } = payload;
  if (Number(endKwh) < Number(startKwh)) {
    const err = new Error("Invalid meter: end_kwh < start_kwh");
    err.status = 400;
    throw err;
  }
  return repo.captureMeterTx(payload);
}

module.exports = { captureMeter };
