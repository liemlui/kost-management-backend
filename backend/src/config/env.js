const dotenv = require("dotenv");

function mustGet(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),

  db: {
    host: mustGet("DB_HOST"),
    port: Number(mustGet("DB_PORT")),
    name: mustGet("DB_NAME"),
    user: mustGet("DB_USER"),
    password: mustGet("DB_PASSWORD"),
    ssl: String(process.env.DB_SSL || "false").toLowerCase() === "true",
  },
};

module.exports = env;
