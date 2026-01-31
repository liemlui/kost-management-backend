// src/middlewares/errorHandler.js
const logger = require("../config/logger");

module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || res.statusCode || 500;

  logger.error("http.error", {
    method: req.method,
    path: req.path,
    message: err.message,
    status,
    stack: err.stack,
    sessionId: req.sessionID ? req.sessionID.substring(0, 10) + "..." : null,
    sessionHasFlash: !!req.session?.flash,
  });

  // jangan render kalau header sudah terkirim
  if (res.headersSent) return next(err);

  res.status(status);

  // SSOT: selalu kirim variable yang dipakai error.ejs
  return res.render("error", {
    title: "Error",
    status,
    path: req.originalUrl || req.path,
    requestId: req.headers["x-request-id"] || null,
    message: err.message || "Unknown error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
