import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM admin WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = result[0];

    const token = jwt.sign(
      { adminId: admin.id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 🔥 Send admin details also
    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  });
});

export default router;