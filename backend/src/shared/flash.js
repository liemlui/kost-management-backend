// src/shared/flash.js
const logger = require("../config/logger");

module.exports = {
  setFlash: (req, type, message) => {
    if (!req.session) {
      logger.warn("flash.no_session", { action: "setFlash" });
      return Promise.resolve();
    }
    
    logger.info("flash.set", { type, message, sessionId: req.sessionID });
    req.session.flash = { type, message };
    
    return new Promise((resolve) => {
      req.session.save((err) => {
        if (err) {
          logger.error("flash.save_error", { error: err.message });
        }
        resolve();
      });
    });
  },
  
  setFlashErrors: (req, errors) => {
    if (!req.session) {
      logger.warn("flash.no_session", { action: "setFlashErrors" });
      return Promise.resolve();
    }
    
    const messages = Array.isArray(errors) ? errors : [errors];
    logger.info("flash.set_errors", { 
      count: messages.length, 
      messages, 
      sessionId: req.sessionID 
    });
    
    req.session.flash = { 
      type: 'danger', 
      messages 
    };
    
    return new Promise((resolve) => {
      req.session.save((err) => {
        if (err) {
          logger.error("flash.save_error", { error: err.message });
        }
        resolve();
      });
    });
  },
  
  getFlash: (req) => {
    if (!req.session) {
      logger.warn("flash.no_session", { action: "getFlash" });
      return null;
    }
    
    const flash = req.session.flash;
    logger.info("flash.get", { 
      flash, 
      sessionId: req.sessionID,
      hasFlash: !!flash 
    });
    
    if (req.session) req.session.flash = null;
    return flash;
  }
};