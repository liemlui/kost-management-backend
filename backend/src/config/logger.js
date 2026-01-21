function log(level, msg, meta) {
  const ts = new Date().toISOString();
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  // eslint-disable-next-line no-console
  console.log(`[${ts}] [${level}] ${msg}${payload}`);
}

module.exports = {
  info: (msg, meta) => log("INFO", msg, meta),
  warn: (msg, meta) => log("WARN", msg, meta),
  error: (msg, meta) => log("ERROR", msg, meta),
};
