// backend/src/middlewares/errorHandler.js
const logger = require("../config/logger");

function errorHandler(err, req, res, next) {
  logger.error("http.error", {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
  });

  res.status(500).json({
    ok: false,
    error: "Internal Server Error",
  });
}

module.exports = errorHandler;
