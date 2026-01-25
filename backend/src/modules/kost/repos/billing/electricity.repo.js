// pwe/backend/src/modules/kost/repos/billing/electricity.repo.js
const { pool } = require("../../../../db/pool");
const sql = require("../../sql/billing");

/**
 * Capture meter per invoice (transactional)
 * - insert 2 readings
 * - update invoice_electricity
 * - upsert/delete ELECTRIC_OVERAGE
 * - recalc invoice total
 */
async function captureMeterTx({ invoiceId, roomId, startKwh, endKwh, actorId = null }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // lock invoice_electricity row
    const ieRes = await client.query(sql.electricity.getInvoiceElectricityForUpdate, [invoiceId]);
    if (ieRes.rowCount === 0) throw new Error(`invoice_electricity not found for invoice_id=${invoiceId}`);

    const { allowance_kwh: allowance, tariff_per_kwh: tariff, room_id: ieRoomId } = ieRes.rows[0];
    if (Number(ieRoomId) !== Number(roomId)) throw new Error(`room_id mismatch for invoice_id=${invoiceId}`);

    // insert readings
    const startNote = `meter_start for invoice ${invoiceId}`;
    const endNote = `meter_end for invoice ${invoiceId}`;

    const startRead = await client.query(sql.electricity.insertReading, [roomId, startKwh, actorId, startNote]);
    const endRead = await client.query(sql.electricity.insertReading, [roomId, endKwh, actorId, endNote]);

    const startReadingId = startRead.rows[0].id;
    const endReadingId = endRead.rows[0].id;

    const kwhUsed = Number(endKwh) - Number(startKwh);
    const overKwhInt = Math.max(Math.floor(kwhUsed - Number(allowance)), 0);

    let overAmount = 0;
    if (overKwhInt > 0) {
      overAmount = Math.round((overKwhInt * Number(tariff)) / 1000) * 1000; // rounding ribuan
    }

    await client.query(sql.electricity.updateInvoiceElectricity, [
      invoiceId,
      startReadingId,
      endReadingId,
      startKwh,
      endKwh,
      kwhUsed,
      overKwhInt,
      overAmount,
    ]);

    if (overAmount > 0) {
      await client.query(sql.electricity.upsertOverageItem, [invoiceId, overAmount]);
    } else {
      await client.query(sql.electricity.deleteOverageItem, [invoiceId]);
    }

    await client.query(sql.electricity.recalcInvoiceTotal, [invoiceId]);

    await client.query("COMMIT");
    return { invoiceId, kwhUsed, overKwhInt, overAmount };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { captureMeterTx };
