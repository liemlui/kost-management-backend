// backend/src/app.js
const express = require("express");
const helmet = require("helmet");
const path = require("path");

const requestLogger = require("./middlewares/requestLogger");
const errorHandler = require("./middlewares/errorHandler");

const kostRoutes = require("./modules/kost/routes");


const app = express();

// security + basics
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// static
app.use(express.static(path.join(__dirname, "public")));

// view engine (for quick admin UI)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// logs
app.use(requestLogger);

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
