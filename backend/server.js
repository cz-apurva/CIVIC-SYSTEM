const express = require("express");
const cors    = require("cors");
const dotenv  = require("dotenv");

dotenv.config();

const authRoutes  = require("./routes/auth");
const issueRoutes = require("./routes/issues");
const bertRoute   = require("./routes/bert");
const smsRoute = require('./routes/sms');


const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ── BERT Priority Scoring (must be before generic /api/issues)
app.use("/api", bertRoute);

// ── Core Routes
app.use("/api/auth",   authRoutes);
app.use("/api/issues", issueRoutes);
app.use('/api', smsRoute);


// ── Health check
app.get("/", (req, res) => {
  res.send("Smart Civic Infrastructure API Running — BERT Scoring Active on port 5001");
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
  console.log(`BERT microservice expected at http://localhost:5001`);
  console.log(`Run: python bert_service.py  (in a separate terminal)`);
});