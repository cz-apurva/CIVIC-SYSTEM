const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const verifyToken = require("../middleware/authMiddleware");
const { sendConfirmationEmail } = require('./email');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

console.log("DEBUG: sendConfirmationEmail is:", typeof sendConfirmationEmail);

router.post("/report", verifyToken, upload.single("image"), (req, res) => {
  const { title, description, category, lat, lng, email, bert_score, bert_label, department, refNo } = req.body;
  const image = req.file ? req.file.filename : null;

  // Ensure these column names match your MySQL table EXACTLY
  const sql = `INSERT INTO issues 
    (title, description, category, location, email, image, status, bert_score, bert_label, department, refNo) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    title, description, category, `${lat},${lng}`, email || '', 
    image, 'Pending', bert_score || 50, bert_label || 'Medium', department, refNo
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("SQL Error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Issue reported", id: result.insertId });
  });
});

// Change "/all" to "/" with GET method
router.get("/all", verifyToken, (req, res) => {
  // Fix: Change 'createdAt' to 'id' (or remove the ORDER BY entirely)
  const sql = "SELECT * FROM issues ORDER BY id DESC"; 
  
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ 
        message: "Failed to fetch issues", 
        error: err.message // This sends the 'Unknown column' error to the frontend
      });
    }

    return res.json(result);
  });
});

router.post("/send-email", verifyToken, async (req, res) => {
  // 1. Log the body to see what the frontend actually sent
  console.log("BACKEND RECEIVED BODY:", req.body);

  // 2. Extract the email (The frontend is sending it as 'to')
  const { to, refNo, title, department, deptEmail } = req.body;

  try {
    // 3. Explicitly pass 'to' as the first argument
    if (!to) throw new Error("Recipient address 'to' is missing in request body");

    await sendConfirmationEmail(to, refNo, title, department, deptEmail);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("FINAL EMAIL ERROR:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;