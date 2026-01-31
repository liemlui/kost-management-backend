// src/middlewares/kostLocals.middleware.js
const { todayISO_WIB } = require("../shared/dates");

module.exports = function kostLocals(req, res, next) {
  // super clean: module locals only (no flash consumption here)
  res.locals.todayISO = todayISO_WIB();

  if (typeof res.locals.title === "undefined") {
    res.locals.title = "Kost Admin";
  }

  next();
};
