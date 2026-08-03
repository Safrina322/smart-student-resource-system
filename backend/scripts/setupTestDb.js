// Creates the integration-test database (if missing) and brings it up to
// date with every migration, using the same migrations/runner.js the real
// app boots with - integration tests run against actual schema, not a
// hand-maintained copy of it. DB_NAME is overridden BEFORE dotenv.config()
// so the .env file's value (the real dev database) never gets used here by
// accident, and before any import of db.js so its connection pool picks up
// the override.
process.env.DB_NAME = process.env.TEST_DB_NAME || "smartstudent_test";

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const adminConnection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
await adminConnection.end();

const { runMigrations } = await import("../migrations/runner.js");
await runMigrations();

console.log(`✅ Test database "${process.env.DB_NAME}" ready.`);
process.exit(0);
