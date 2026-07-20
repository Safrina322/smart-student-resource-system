import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Pooled connections survive idle timeouts/drops and support concurrent
// requests; a single mysql.createConnection() cannot recover from a dropped
// connection and serializes every query behind it.
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Hosted providers (Aiven, PlanetScale, etc.) require TLS; local dev
  // MySQL doesn't have it configured, so this stays off unless DB_SSL=true.
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ MySQL Connected");
    connection.release();
  }
});

// Promise wrapper around the callback pool so repositories/services can use
// async/await instead of nested callbacks.
export const queryAsync = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

export default db;

