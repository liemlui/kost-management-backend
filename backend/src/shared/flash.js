// src/shared/flash.js
const logger = require("../config/logger");

function defaultFlash() {
  return {
    success: null,
    error: null,
    info: null,
    warnings: [],
    errors: [],
    form: null,
  };
}

// normalize untuk backward compatibility:
// - old: { type, message }
// - old errors: { type: 'danger', messages: [...] }
// - new: { success, error, errors, form, ... }
function normalizeFlash(raw) {
  const f = defaultFlash();
  if (!raw) return f;

  // already new contract
  if (
    typeof raw.success !== "undefined" ||
    typeof raw.error !== "undefined" ||
    typeof raw.info !== "undefined" ||
    typeof raw.errors !== "undefined" ||
    typeof raw.form !== "undefined"
  ) {
    return {
      ...f,
      ...raw,
      warnings: Array.isArray(raw.warnings) ? raw.warnings : f.warnings,
      errors: Array.isArray(raw.errors) ? raw.errors : f.errors,
    };
  }

  // old contract
  if (raw.type && raw.message) {
    const t = String(raw.type).toLowerCase();
    if (t === "success") f.success = raw.message;
    else if (t === "danger" || t === "error") f.error = raw.message;
    else if (t === "warning") f.warnings = [raw.message];
    else f.info = raw.message;
    return f;
  }

  if (raw.type && Array.isArray(raw.messages)) {
    // old setFlashErrors
    f.errors = raw.messages;
    return f;
  }

  return f;
}

function saveSession(req) {
  return new Promise((resolve) => {
    if (!req.session) return resolve();
    req.session.save((err) => {
      if (err) logger.error("flash.save_error", { error: err.message });
      resolve();
    });
  });
}

async function setFlash(req, type, message, form = null) {
  if (!req.session) {
    logger.warn("flash.no_session", { action: "setFlash" });
    return;
  }

  const f = defaultFlash();
  const t = String(type || "").toLowerCase();

  if (t === "success") f.success = message;
  else if (t === "danger" || t === "error") f.error = message;
  else if (t === "warning") f.warnings = [message];
  else f.info = message;

  if (form) f.form = form;

  req.session.flash = f;
  logger.info("flash.set", { type: t, hasForm: !!form, sessionId: req.sessionID });
  await saveSession(req);
}

async function setFlashErrors(req, errors, form = null) {
  if (!req.session) {
    logger.warn("flash.no_session", { action: "setFlashErrors" });
    return;
  }

  const f = defaultFlash();
  const messages = Array.isArray(errors) ? errors : [errors];
  f.errors = messages.filter(Boolean);

  if (form) f.form = form;

  req.session.flash = f;
  logger.info("flash.set_errors", {
    count: f.errors.length,
    hasForm: !!form,
    sessionId: req.sessionID,
  });
  await saveSession(req);
}

function getFlash(req) {
  if (!req.session) return defaultFlash();

  const raw = req.session.flash;
  req.session.flash = null;

  const f = normalizeFlash(raw);
  logger.info("flash.get", { hasFlash: !!raw, sessionId: req.sessionID });
  return f;
}

module.exports = { setFlash, setFlashErrors, getFlash, normalizeFlash, defaultFlash };
