import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";   // your MySQL connection
import jwt from "jsonwebtoken";

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql =
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

    db.query(sql, [username, email, hashedPassword], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "User registered successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (result.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result[0];

    let isMatch = false;

    if (user.password?.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;

      if (isMatch) {
        const upgradedHash = await bcrypt.hash(password, 10);
        db.query("UPDATE users SET password = ? WHERE id = ?", [upgradedHash, user.id]);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  });
});


// DELETE user by username (TEMP – for testing only)
// router.delete("/delete/:username", async (req, res) => {
//   try {
//     const user = await User.findOneAndDelete({
//       username: req.params.username
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({ message: "User deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });
export default router;
