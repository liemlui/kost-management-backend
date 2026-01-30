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
    
    // Log hanya pada request yang signifikan
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
// 4. FLASH MIDDLEWARE (SET FLASH TO LOCALS)
// ============================================
app.use((req, res, next) => {
  // Debug: log setiap request untuk tracking session
  logger.info("request.session", {
    sessionId: req.sessionID?.substring(0, 10) + '...',
    path: req.path,
    hasSession: !!req.session,
    flashInSession: req.session?.flash
  });
  
  // Get flash message
  res.locals.flash = getFlash(req);
  logger.info("request.flash_set_to_locals", { 
    flash: res.locals.flash 
  });
  
  next();
});

// ============================================
// 5. REQUEST LOGGER
// ============================================
app.use(requestLogger);

// ============================================
// 6. STATIC FILES
// ============================================
app.use(express.static(path.join(__dirname, "public")));

// ============================================
// 7. VIEW ENGINE CONFIGURATION
// ============================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ============================================
// 8. DEBUG & TEST ROUTES (Development Only)
// ============================================
if (process.env.NODE_ENV !== "production") {
  // Debug session
  app.get("/debug-session", (req, res) => {
    logger.info("debug.session", {
      sessionId: req.sessionID,
      sessionData: req.session,
    });
    
    req.session.test = "test-value";
    req.session.save((err) => {
      if (err) {
        logger.error("debug.session_save_error", { error: err.message });
        return res.json({ error: err.message });
      }
      res.json({
        sessionId: req.sessionID,
        session: req.session,
        cookie: req.session.cookie,
      });
    });
  });

  // Debug flash test JSON endpoint
  app.get("/debug/flash-test", async (req, res) => {
    const { setFlash, getFlash } = require("./shared/flash");
    
    await setFlash(req, "success", "Test flash message from debug route");
    
    const flash = getFlash(req);
    res.json({
      sessionId: req.sessionID,
      flashSet: req.session.flash,
      flashGet: flash,
      session: {
        id: req.sessionID,
        cookie: req.session.cookie
      }
    });
  });

  // Simple flash view for debugging
  app.get("/debug/flash-view", (req, res) => {
    res.send(`
      <html>
      <head>
        <title>Flash Test</title>
        <link rel="stylesheet" href="/css/bootstrap.min.css">
      </head>
      <body>
        <div class="container mt-4">
          <h1>Flash Test</h1>
          <pre>${JSON.stringify(req.session.flash, null, 2)}</pre>
          <a href="/debug/flash-test" class="btn btn-primary">Set Flash via GET</a>
          
          <hr>
          
          <h3>Set Flash via Form</h3>
          <form method="POST" action="/debug/flash-set" class="mb-3">
            <div class="mb-2">
              <label class="form-label">Type:</label>
              <select name="type" class="form-select">
                <option value="success">Success</option>
                <option value="danger">Danger</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label">Message:</label>
              <input type="text" name="message" class="form-control" value="Test message from form">
            </div>
            <button type="submit" class="btn btn-primary">Set Flash</button>
          </form>
        </div>
      </body>
      </html>
    `);
  });

  // POST route for flash test
  app.post("/debug/flash-set", async (req, res) => {
    const { setFlash } = require("./shared/flash");
    const { type, message } = req.body;
    
    logger.info("debug.flash_set", { type, message });
    await setFlash(req, type, message);
    
    res.redirect("/debug/flash-view");
  });

  // ============================================
  // SIMPLE FLASH TEST ENDPOINTS
  // ============================================
  app.get("/test/set-flash", async (req, res) => {
    const { setFlash } = require("./shared/flash");
    
    logger.info("test.set_flash", { 
      sessionId: req.sessionID,
      beforeFlash: req.session.flash 
    });
    
    await setFlash(req, 'success', 'Test flash message worked!');
    
    logger.info("test.after_set_flash", { 
      sessionId: req.sessionID,
      afterFlash: req.session.flash 
    });
    
    res.redirect("/test/show-flash");
  });

  app.get("/test/show-flash", (req, res) => {
    const flash = req.session.flash;
    
    logger.info("test.show_flash", { 
      sessionId: req.sessionID,
      flashInSession: flash,
      localsFlash: res.locals.flash 
    });
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Flash Test</title>
        <link rel="stylesheet" href="/css/bootstrap.min.css">
      </head>
      <body>
        <div class="container mt-4">
          <h1>Flash Test Results</h1>
          
          <div class="card mb-3">
            <div class="card-body">
              <h5>Session ID:</h5>
              <code>${req.sessionID}</code>
            </div>
          </div>
          
          <div class="card mb-3">
            <div class="card-body">
              <h5>Flash in Session:</h5>
              <pre>${JSON.stringify(flash, null, 2)}</pre>
            </div>
          </div>
          
          <div class="card mb-3">
            <div class="card-body">
              <h5>Flash in res.locals:</h5>
              <pre>${JSON.stringify(res.locals.flash, null, 2)}</pre>
            </div>
          </div>
          
          <a href="/test/set-flash" class="btn btn-primary">Set Flash Again</a>
          <a href="/admin/kost/rooms" class="btn btn-secondary">Go to Rooms</a>
        </div>
      </body>
      </html>
    `);
  });
}

// ============================================
// 9. HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ============================================
// 10. APPLICATION ROUTES
// ============================================
app.use("/admin/kost", kostRoutes);

// ============================================
// 11. TEMPORARY HOME PAGE
// ============================================
app.get("/", (req, res) => {
  res.send("PWE backend running ✅");
});

// ============================================
// 12. ERROR HANDLING
// ============================================
app.use(errorHandler);

module.exports = app;