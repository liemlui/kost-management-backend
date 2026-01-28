const { pool } = require("../../../../db/pool");
const logger = require("../../../../config/logger");
const sql = require("../../sql");

async function listActiveItems() {
  const { rows } = await pool.query(
    sql.inventory.listActiveItems,
    []
  );
  return rows;
}

async function listActiveLocations() {
  // auto-seed: Gudang Utama (idempotent)
  await pool.query(sql.inventory.ensureDefaultGudangUtama, []);

  const { rows } = await pool.query(
    sql.inventory.listActiveLocations,
    []
  );
  return rows;
}


async function listMovements({ item_id = null, movement_type = null }) {
  const params = [
    item_id ? Number(item_id) : null,
    movement_type || null,
  ];
  const { rows } = await pool.query(
    sql.inventory.listMovements,
    params
  );
  return rows;
}

async function createMovementTx(payload) {
  const client = await pool.connect();

  async function qTx(text, params, qname) {
    const start = Date.now();
    try {
      const res = await client.query(text, params);
      logger.info("db.query", {
        qname,
        ms: Date.now() - start,
        rows: res.rowCount,
      });
      return res;
    } catch (err) {
      logger.error("db.query_failed", {
        qname,
        ms: Date.now() - start,
        message: err.message,
      });
      throw err;
    }
  }

  try {
    await qTx("BEGIN", [], "kost.inventory.tx.begin");

    const {
      item_id,
      movement_type,
      qty,
      unit_cost,
      from_location_id,
      to_location_id,
      condition_after,
      notes,
      source = "MANUAL",
      finance_txn_id = null,
      _in,
      _out,
    } = payload;

// --- OUT (precheck + guarded)
let outAvgUnitCost = null;

if (_out) {
  const bal = await qTx(
    sql.inventory.getBalance,
    [item_id, from_location_id],
    "kost.inventory.balance.getForOut"
  );

  if (bal.rowCount === 0) {
    const err = new Error(
      "Belum ada stok untuk item ini di lokasi asal. Lakukan PURCHASE atau ADJUST IN terlebih dahulu."
    );
    err.status = 400;
    throw err;
  }

  const available = Number(bal.rows[0]?.qty_on_hand || 0);
  if (available < qty) {
    const err = new Error(
      `Stok tidak cukup di lokasi asal. Tersedia: ${available}, diminta: ${qty}.`
    );
    err.status = 400;
    throw err;
  }

  const out = await qTx(
    sql.inventory.decreaseBalanceGuarded,
    [item_id, from_location_id, qty],
    "kost.inventory.balance.decrease"
  );

  if (out.rowCount === 0) {
    const err = new Error("Stok berubah saat diproses. Coba ulangi.");
    err.status = 400;
    throw err;
  }

  outAvgUnitCost = out.rows[0]?.avg_unit_cost ?? null;
}

// --- IN
if (_in) {
  let inUnitCost = unit_cost ?? null;

  if (movement_type === "TRANSFER" || movement_type === "REPAIR") {
    // carry cost dari lokasi asal (sebelum/bersamaan OUT)
    inUnitCost = outAvgUnitCost;
  }

  await qTx(
    sql.inventory.increaseBalanceUpsert,
    [item_id, to_location_id, qty, inUnitCost],
    "kost.inventory.balance.increase"
  );
}

    // --- INSERT MOVEMENT (AUDIT TRAIL)
    const ins = await qTx(
      sql.inventory.insertMovement,
      [
        item_id,
        from_location_id,
        to_location_id,
        movement_type,
        qty,
        unit_cost ?? null,
        condition_after ?? null,
        notes ?? null,
        source,
        finance_txn_id,
      ],
      "kost.inventory.movements.insert"
    );

    await qTx("COMMIT", [], "kost.inventory.tx.commit");
    return { id: ins.rows[0]?.id };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
      logger.info("db.query", { qname: "kost.inventory.tx.rollback" });
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listActiveItems,
  listActiveLocations,
  listMovements,
  createMovementTx,
};
