const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All required fields must be filled" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(500).json({ message: "Database error", error: checkErr });
    }

    if (checkResult.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "citizen"],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Registration failed", error: err });
        }

        return res.status(201).json({
          message: "User registered successfully",
          userId: result.insertId
        });
      }
    );
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // 1. Verify user exists
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (result.length === 0) return res.status(401).json({ message: "Invalid email or password" });

    const user = result[0];

    // 2. Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // 3. Generate Token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, user: { name: user.name, email: user.email } });
  });
});

module.exports = router;