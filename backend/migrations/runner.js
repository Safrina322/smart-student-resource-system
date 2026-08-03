import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { queryAsync } from "../db.js";
import logger from "../utils/logger.js";

const migrationsDir = path.dirname(fileURLToPath(import.meta.url));

const ensureMigrationsTable = () =>
  queryAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

// Good enough for this project's migrations (plain DDL, no stored
// procedures/triggers with embedded semicolons) - avoids needing the
// mysql2 `multipleStatements` connection flag, which this project
// deliberately doesn't enable pool-wide since it widens the blast radius of
// any future SQL-injection bug from "one statement" to "however many the
// attacker can chain".
const splitStatements = (sql) =>
  sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

// Applies every .sql file in this directory that isn't already recorded in
// schema_migrations, in filename order (hence the numeric prefix convention
// - 0001_, 0002_, ...), each file applied exactly once and recorded
// immediately after. Unlike the imperative "SHOW COLUMNS then ALTER if
// missing" approach this replaced, a migration that fails throws and stops
// boot instead of logging a warning and continuing - a broken schema should
// fail loudly, not run silently degraded.
export const runMigrations = async () => {
  await ensureMigrationsTable();

  const applied = await queryAsync("SELECT name FROM schema_migrations");
  const appliedNames = new Set(applied.map((row) => row.name));

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
  const pending = files.filter((file) => !appliedNames.has(file));

  if (pending.length === 0) {
    logger.info("Database schema up to date - no pending migrations");
    return;
  }

  for (const file of pending) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    const statements = splitStatements(sql);

    for (const statement of statements) {
      await queryAsync(statement);
    }

    await queryAsync("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
    logger.info(`Applied migration ${file} (${statements.length} statement(s))`);
  }
};
