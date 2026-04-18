const express = require("express");
const cors    = require("cors");
const dotenv  = require("dotenv");

dotenv.config();

const authRoutes  = require("./routes/auth");
const issueRoutes = require("./routes/issues");
const bertRoute   = require("./routes/bert");
const emailRoute  = require("./routes/email");

const app = express();

// ── CORS — allow localhost:3000 (React dev) ──
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ── Routes ── (order matters — specific before generic)
app.use("/api/auth",       authRoutes);
app.use("/api/issues",     issueRoutes);
app.use("/api", bertRoute);    // handles /api/bert-priority
app.use("/api", emailRoute.router);   // handles /api/send-email

// ── Health check ──
app.get("/", (req, res) => {
  res.json({
    status:  "ok",
    message: "SCIS API running",
    version: "2.0",
    bert:    `http://localhost:5001 (run: python bert_service.py)`,
  });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ SCIS Server running on port ${PORT}`);
  console.log(`   Auth:   http://localhost:${PORT}/api/auth`);
  console.log(`   Issues: http://localhost:${PORT}/api/issues`);
  console.log(`   BERT:   http://localhost:${PORT}/api/bert-priority`);
  console.log(`   Email:  http://localhost:${PORT}/api/send-email`);
  console.log(`\n   BERT AI: run "python bert_service.py" in a separate terminal\n`);
});
