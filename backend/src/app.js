// backend/src/app.js
const express = require("express");
const helmet = require("helmet");
const path = require("path");

const requestLogger = require("./middlewares/requestLogger");
const errorHandler = require("./middlewares/errorHandler");

const kostRoutes = require("./modules/kost/routes");

const app = express();
const session = require("express-session");

// security + basics
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "pwe.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true kalau HTTPS
      maxAge: 1000 * 60 * 30, // 30 menit
    },
  }),
);

// static
app.use(express.static(path.join(__dirname, "public")));

// view engine (for quick admin UI)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// logs
app.use(requestLogger);

app.use((req, res, next) => {
  res.locals.flash = req.session?.flash || null;
  if (req.session) req.session.flash = null;
  next();
});

// healthcheck
app.get("/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// routes
app.use("/admin/kost", kostRoutes);

// TEMP home
app.get("/", (req, res) => {
  res.send("PWE backend running ✅");
});

app.use(errorHandler);

module.exports = app;
