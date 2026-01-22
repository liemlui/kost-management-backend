// backend/src/middlewares/requestLogger.js
const logger = require("../config/logger");

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;
    logger.info("http.request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms,
    });
  });

  next();
}

module.exports = requestLogger;
