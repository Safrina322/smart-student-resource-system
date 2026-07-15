import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Pooled connections survive idle timeouts/drops and support concurrent
// requests; a single mysql.createConnection() cannot recover from a dropped
// connection and serializes every query behind it.
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ MySQL Connected");
    connection.release();
  }
});

export default db;

