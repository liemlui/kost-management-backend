const logger = require("../config/logger");

function errorHandler(err, req, res, next) {
  logger.error("http.error", {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: err.stack,
    sessionId: req.sessionID?.substring(0, 10) + '...',
    sessionHasFlash: !!req.session?.flash
  });

  // Development mode: tampilkan error detail
  const isDev = process.env.NODE_ENV !== "production";
  
  if (req.accepts('html')) {
    res.status(err.status || 500).render('error', {
      title: 'Error',
      message: err.message,
      error: isDev ? err : {},
      flash: req.session?.flash
    });
  } else if (req.accepts('json')) {
    res.status(err.status || 500).json({
      ok: false,
      error: err.message,
      stack: isDev ? err.stack : undefined,
      sessionId: req.sessionID
    });
  } else {
    res.status(err.status || 500).type('txt').send(`Error: ${err.message}`);
  }
}

module.exports = errorHandler;