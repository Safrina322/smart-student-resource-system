import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { parseCookie as parseCookieHeader } from "cookie";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "./openapi/document.js";
import db, { queryAsync } from "./db.js";
import { runMigrations } from "./migrations/runner.js";
import { setIo } from "./utils/socket.js";
import logger from "./utils/logger.js";
import { ACCESS_TOKEN_COOKIE } from "./utils/cookies.js";
import { ensureCsrfCookie, csrfProtection } from "./middleware/csrf.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import adminCourseRoutes from "./routes/adminCourseRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import adminRequestRoutes from "./routes/adminRequestRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import userLearningRoutes from "./routes/userLearningRoutes.js";
import popularResourcesRoutes from "./routes/popularResourcesRoutes.js";
import userNotificationRoutes from "./routes/userNotificationRoutes.js";
import adminAuditRoutes from "./routes/adminAuditRoutes.js";
import lecturerResourceRoutes from "./routes/lecturerResourceRoutes.js";
import moderationRoutes from "./routes/moderationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import resourceHubRoutes from "./routes/resourceHubRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import csrfRoutes from "./routes/csrfRoutes.js";
import { startReportScheduler } from "./utils/reportScheduler.js";
dotenv.config();

const app = express();

// Schema is managed by versioned files in migrations/ (see
// migrations/README.md) rather than the imperative "check if a column
// exists, ALTER if not" functions this replaced - that approach had no
// single place to see the full migration history in order, and several of
// those functions ran fire-and-forget (not awaited), which was a real
// cold-boot race condition, not just a style complaint. Must finish before
// anything else runs, hence the top-level await.
await runMigrations();

// Self-registration only creates students, so lecturer/moderator accounts
// have no signup path yet - seed one of each with known credentials so the
// role-gated dashboards are demoable without a manual DB insert.
const seedDemoRoleAccounts = async () => {
  const demoAccounts = [
    { username: "demo.lecturer", email: "demo.lecturer@smartstudent.dev", role: "lecturer" },
    { username: "demo.moderator", email: "demo.moderator@smartstudent.dev", role: "moderator" },
  ];

  for (const { username, email, role } of demoAccounts) {
    try {
      const rows = await queryAsync("SELECT id FROM users WHERE username = ?", [username]);
      if (rows.length > 0) continue;

      const hashedPassword = await bcrypt.hash("Demo@12345", 10);
      await queryAsync(
        "INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, 1)",
        [username, email, hashedPassword, role]
      );
      logger.info(`Seeded demo ${role} account: ${username} / Demo@12345`);
    } catch (err) {
      logger.error({ err }, `Failed to seed demo ${role}`);
    }
  }
};

// The only sysadmin account previously came from a one-time manual run of
// database_setup.sql, so a fresh database (e.g. a newly provisioned host)
// had no way to log into the admin panel at all until this ran.
const seedDefaultAdmin = async () => {
  try {
    const rows = await queryAsync("SELECT id FROM admin LIMIT 1");
    if (rows.length > 0) return;

    const hashedPassword = await bcrypt.hash("admin123", 10);
    await queryAsync(
      "INSERT INTO admin (name, email, password, department, role) VALUES (?, ?, ?, ?, ?)",
      ["Admin User", "fathimasafrina57@gmail.com", hashedPassword, "Administration", "sysadmin"]
    );
    logger.info("Seeded default admin account: fathimasafrina57@gmail.com / admin123");
  } catch (err) {
    logger.error({ err }, "Failed to seed default admin");
  }
};

// A freshly deployed environment has an empty resource hub, so every AI
// Tools search / resource browse comes back empty until someone actually
// uploads and gets a resource approved - not something a visitor evaluating
// the site should have to do first. Seeds a small set of real, correctly-
// linked resources (research papers, lecture notes, videos) pre-approved
// under the demo lecturer account, so search/browse/AI tools all have real
// content immediately. Checked by title, once - safe to run on every boot.
const seedDemoResources = async () => {
  const DEMO_RESOURCES = [
    {
      title: "Attention Is All You Need — Transformer Architecture",
      description:
        "The original research paper introducing the Transformer architecture, the foundation of modern large language models.",
      subject: "Artificial Intelligence",
      department: "CS",
      semester: 4,
      resource_type: "PDF",
      resource_link: "https://arxiv.org/pdf/1706.03762",
      tags: "ai,deep-learning,transformers",
    },
    {
      title: "Deep Residual Learning for Image Recognition (ResNet)",
      description:
        "The paper that introduced residual connections in convolutional neural networks, enabling very deep image recognition models.",
      subject: "Machine Learning",
      department: "CS",
      semester: 4,
      resource_type: "PDF",
      resource_link: "https://arxiv.org/pdf/1512.03385",
      tags: "cnn,computer-vision,resnet",
    },
    {
      title: "Linear Algebra Essentials for Data Science",
      description:
        "A concise study guide covering vectors, matrices, eigenvalues, and eigenvectors as applied to data science and machine learning workflows.",
      subject: "Mathematics",
      department: "CS",
      semester: 2,
      resource_type: "PDF",
      resource_link: "https://cs229.stanford.edu/section/cs229-linalg.pdf",
      tags: "math,linear-algebra,vectors",
    },
    {
      title: "Probability & Statistics Review for Machine Learning",
      description: "Stanford CS229 review notes covering probability theory and statistics foundations needed for ML.",
      subject: "Mathematics",
      department: "CS",
      semester: 3,
      resource_type: "PDF",
      resource_link: "https://cs229.stanford.edu/section/cs229-prob.pdf",
      tags: "probability,statistics,math",
    },
    {
      title: "Word Vectors and Word Embeddings",
      description: "Stanford CS224N lecture notes introducing word vector representations (word2vec, GloVe) for NLP.",
      subject: "Natural Language Processing",
      department: "CS",
      semester: 5,
      resource_type: "PDF",
      resource_link: "https://web.stanford.edu/class/cs224n/readings/cs224n-2019-notes01-wordvecs1.pdf",
      tags: "nlp,word2vec,embeddings",
    },
    {
      title: "Essence of Linear Algebra: Vectors",
      description:
        "3Blue1Brown video explaining what vectors really are, visually and intuitively - a great primer before diving into matrix math.",
      subject: "Mathematics",
      department: "CS",
      semester: 2,
      resource_type: "Video",
      resource_link: "https://www.youtube.com/watch?v=fNk_zzaMoSs",
      tags: "linear-algebra,vectors,video",
    },
    {
      title: "But What Is a Neural Network?",
      description: "3Blue1Brown video visually explaining how neural networks work, from neurons to weights to activations.",
      subject: "Artificial Intelligence",
      department: "CS",
      semester: 4,
      resource_type: "Video",
      resource_link: "https://www.youtube.com/watch?v=aircAruvnKk",
      tags: "neural-networks,deep-learning,video",
    },
  ];

  try {
    const lecturerRows = await queryAsync("SELECT id FROM users WHERE username = 'demo.lecturer'");
    const lecturerId = lecturerRows[0]?.id;
    if (!lecturerId) return; // seedDemoRoleAccounts runs first, but guard anyway

    for (const resource of DEMO_RESOURCES) {
      const existing = await queryAsync("SELECT id FROM lecturer_resources WHERE title = ?", [
        resource.title,
      ]);
      if (existing.length > 0) continue;

      await queryAsync(
        `INSERT INTO lecturer_resources
          (uploader_id, title, description, subject, department, semester, resource_type, resource_link, tags, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
        [
          lecturerId,
          resource.title,
          resource.description,
          resource.subject,
          resource.department,
          resource.semester,
          resource.resource_type,
          resource.resource_link,
          resource.tags,
        ]
      );
      logger.info(`Seeded demo resource: ${resource.title}`);
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed demo resources");
  }
};

// Older approved requests without an uploaded image got a literal
// "default.jpg" written to courses.image - a file that was never actually
// created, so every card wasted a failed request before falling back to
// the placeholder. Clearing it to NULL goes straight to the placeholder
// instead. Safe to run on every boot: once cleared, the WHERE clause
// matches nothing.
const cleanupLegacyImageSentinel = async () => {
  try {
    const result = await queryAsync("UPDATE courses SET image = NULL WHERE image = 'default.jpg'");
    if (result.affectedRows > 0) {
      logger.info(`Cleared legacy "default.jpg" image sentinel on ${result.affectedRows} course(s)`);
    }
  } catch (err) {
    logger.error({ err }, "Failed to clean up legacy image sentinel");
  }
};

// ✅ Configure CORS for the frontend app
// Vite picks the next free port (5174, 5175, ...) whenever 5173 is already
// taken by another process, which silently breaks a fixed-origin CORS check
// with a generic "network error" in the browser. In development, allow any
// localhost port instead of hardcoding one; production still locks to the
// configured FRONTEND_URL.
const isProduction = process.env.NODE_ENV === "production";
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin / non-browser requests (curl, server-to-server)
    if (origin === process.env.FRONTEND_URL) return callback(null, true);
    if (!isProduction && /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  // Cookies must ride along on cross-origin requests for the httpOnly
  // access/refresh-token cookies to work at all.
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};
// crossOriginResourcePolicy is relaxed because the frontend (port 5173) and
// this API/static file server (port 5000) are different origins; helmet's
// default "same-origin" policy would block the frontend from loading
// /images and /lesson-files.
//
// contentSecurityPolicy is spelled out explicitly (rather than left to
// helmet's implicit defaults) so a future helmet upgrade can't silently
// change what's allowed here. Most responses are JSON, where CSP has no
// effect - the one real surface is /api/docs (Swagger UI), which loads its
// scripts as same-origin files (script-src 'self', no inline scripts) and
// needs style-src's 'unsafe-inline' for its injected styles - verified by
// booting the server and inspecting /api/docs directly.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        fontSrc: ["'self'", "https:", "data:"],
        imgSrc: ["'self'", "data:"],
        upgradeInsecureRequests: [],
      },
    },
  })
);
app.use(cors(corsOptions));
app.use(pinoHttp({ logger }));
app.use(cookieParser());
app.use(ensureCsrfCookie);
app.use(csrfProtection);

startReportScheduler();

await seedDemoRoleAccounts();
await seedDefaultAdmin();
await seedDemoResources();
await cleanupLegacyImageSentinel();

logger.info("Database schema and seed data ready");

// Hosted free-tier MySQL (e.g. Aiven) auto-powers-off after a period of no
// activity, which then 404s every request until someone manually resumes it
// in the provider dashboard. A cheap periodic query keeps the connection
// active so the database never looks idle. No-op cost on local dev.
setInterval(() => {
  db.query("SELECT 1", (err) => {
    if (err) logger.warn({ err }, "Keep-alive ping failed");
  });
}, 4 * 60 * 1000);

app.use(express.json());
app.use("/api/health", healthRoutes);
app.use("/api/csrf-token", csrfRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin/requests", adminRequestRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/user", userLearningRoutes);
app.use("/api/popular", popularResourcesRoutes);
app.use("/api/notifications", userNotificationRoutes);
app.use("/api/admin/audit", adminAuditRoutes);
app.use("/api/lecturer/resources", lecturerResourceRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/resource-hub", resourceHubRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/ai", aiRoutes);

// 🔓 expose images folder
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/images", express.static("images"));
app.use("/lesson-files", express.static("lesson-files"));

// ROUTES (ALWAYS BEFORE listen)
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);

// Generated once at boot from the same Zod schemas the `validate` middleware
// enforces at runtime - see openapi/document.js for why response bodies
// aren't part of it.
const openApiDocument = generateOpenApiDocument();
app.get("/api/openapi.json", (req, res) => res.json(openApiDocument));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Keep API errors JSON-only so frontend does not receive HTML error pages.
app.use("/api", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    logger.error({ err }, "API Error");
  }
  res.status(statusCode).json({ message: err.message || "Internal server error" });
});




// START SERVER (LAST)
// Socket.io needs the raw HTTP server (not the Express app) so it can
// upgrade connections to WebSockets on the same port.
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: corsOptions.origin, credentials: true },
});

// Only student-side (users table) tokens are accepted - notifications are
// only ever addressed to users.id right now, so there's nothing for an
// admin-token connection to subscribe to.
//
// The access token is an httpOnly cookie now, invisible to client-side JS,
// so it can't be handed to socket.io as `auth: { token }` like before - the
// client instead connects with `withCredentials: true` and the cookie
// rides along on the handshake's HTTP request automatically, same as any
// other same-site request. Parsed here from the raw Cookie header since
// socket.io's handshake doesn't run through Express's cookie-parser.
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return next(new Error("Unauthorized"));

  const token = parseCookieHeader(cookieHeader)[ACCESS_TOKEN_COOKIE];
  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) return next(new Error("Unauthorized"));
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);
});

setIo(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});


process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught Exception");
});

process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "Unhandled Promise Rejection");
});
