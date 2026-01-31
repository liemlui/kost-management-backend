// backend/src/app.js
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const session = require("express-session");

const requestLogger = require("./middlewares/requestLogger");
const errorHandler = require("./middlewares/errorHandler");
const { getFlash } = require("./shared/flash");

const kostRoutes = require("./modules/kost/routes");
const logger = require("./config/logger");
const viewHelpers = require("./shared/viewHelpers");

const app = express();

// ============================================
// 1. BASIC SECURITY & PARSING MIDDLEWARE
// ============================================
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// 2. SESSION CONFIGURATION
// ============================================
app.use(
  session({
    name: "pwe.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-this",
    resave: true,
    saveUninitialized: false,
    store: new session.MemoryStore(),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 30, // 30 menit
    },
  })
);

// ============================================
// 3. SESSION LOGGING MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  // Log session creation/modification
  if (req.session) {
    req.session._lastAccess = new Date().toISOString();
    
    // Log only for significant requests
    if (req.method !== "GET" || req.path.includes("/new") || req.path.includes("/edit")) {
      logger.info("session.access", {
        sessionId: req.sessionID?.substring(0, 10) + "...",
        path: req.path,
        method: req.method,
        userId: req.session?.userId || "anonymous",
      });
    }
  }
  next();
});

// ============================================
// 4. STATIC FILES
// ============================================
app.use(express.static(path.join(__dirname, "public")));

// ============================================
// 5. FLASH MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  res.locals.flash = getFlash(req);
  next();
});

// ============================================
// 6. REQUEST LOGGER
// ============================================
app.use(requestLogger);

// ============================================
// 7. VIEW ENGINE CONFIGURATION
// ============================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Make view helpers available in ALL EJS templates
Object.assign(app.locals, viewHelpers);

// ============================================
// 8. HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ============================================
// 9. APPLICATION ROUTES
// ============================================
app.use("/admin/kost", kostRoutes);

// ============================================
// 10. TEMPORARY HOME PAGE
// ============================================
app.get("/", (req, res) => {
  res.send("PWE backend running ✅");
});

// ============================================
// 11. ERROR HANDLING
// ============================================
app.use(errorHandler);

module.exports = app;