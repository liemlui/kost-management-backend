const { Pool } = require("pg");
const env = require("../config/env");
const logger = require("../config/logger");

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  logger.error("Unexpected PG pool error", { message: err.message });
});

async function query(text, params, qname = "unnamed") {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const ms = Date.now() - start;
    logger.info("db.query", { qname, ms, rows: res.rowCount });
    return res;
  } catch (err) {
    const ms = Date.now() - start;
    logger.error("db.query_failed", { qname, ms, message: err.message });
    throw err;
  }
}

module.exports = { pool, query };
