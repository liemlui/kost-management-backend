const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const { query } = require("./db/pool");

async function start() {
  // quick DB check on startup
  await query("SELECT 1 as ok", [], "startup_ping");

  app.listen(env.port, () => {
    logger.info("server.started", { port: env.port, env: env.nodeEnv });
  });
}

start().catch((err) => {
  logger.error("server.failed_to_start", { message: err.message });
  process.exit(1);
});
