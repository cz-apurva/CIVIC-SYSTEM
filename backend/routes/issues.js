const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const verifyToken = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/report", verifyToken, upload.single("image"), (req, res) => {
  const { title, description, category, lat, lng } = req.body;
  const image = req.file ? req.file.filename : null;
  const priority = 1;

  db.query(
    "INSERT INTO issues(title, description, category, location, image, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [title, description, category, `${lat},${lng}`, image, "pending", priority],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Failed to report issue", error: err });
      }

      return res.status(201).json({ message: "Issue reported successfully" });
    }
  );
});

router.get("/all", verifyToken, (req, res) => {
  db.query("SELECT * FROM issues", (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch issues", error: err });
    }

    return res.json(result);
  });
});

module.exports = router;