// backend/src/server.js
require("dotenv").config();
const env = require("./config/env");

const app = require("./app");
const logger = require("./config/logger");
const { query } = require("./db/pool");

async function start() {
  // quick DB check on startup
  await query("SELECT 1 as ok", [], "startup_ping");

  app.listen(env.port, () => {
    logger.info("server.started", {
      port: env.port,
      env: env.nodeEnv,
    });

    // Tambahkan console log untuk development
    if (env.nodeEnv === "development") {
      console.log(`\n✅ Server running at:`);
      console.log(`   Local:   http://localhost:${env.port}`);
      console.log(`   Network: http://${getLocalIP()}:${env.port}`);
      console.log(`\n📊 Health check: http://localhost:${env.port}/health`);
      console.log(`🏠 Home page: http://localhost:${env.port}/`);
      console.log(`👨‍💼 Admin kost: http://localhost:${env.port}/admin/kost`);
      console.log(`\n🌱 Environment: ${env.nodeEnv}`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log("─".repeat(50));
    }
  });
}

// Helper function untuk mendapatkan IP lokal
function getLocalIP() {
  const interfaces = require("os").networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "localhost";
}

start().catch((err) => {
  logger.error("server.failed_to_start", { message: err.message });
  process.exit(1);
});
