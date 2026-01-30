// src/modules/kost/middlewares/kostLocals.middleware.js
const { todayISO_WIB } = require("../../../shared/dates");
const { getFlash, defaultFlash } = require("../../../shared/flash");

module.exports = function kostLocals(req, res, next) {
  res.locals.todayISO = todayISO_WIB();

  // SSOT flash consumption (1 pintu)
  try {
    res.locals.flash = getFlash(req);
  } catch {
    res.locals.flash = defaultFlash();
  }

  if (typeof res.locals.title === "undefined") res.locals.title = "Kost Admin";
  next();
};
