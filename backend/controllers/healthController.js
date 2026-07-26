import { queryAsync } from "../db.js";

// Used by the hosting platform (and anyone debugging a "why is prod down"
// incident) to tell "the process is up but the database isn't reachable"
// apart from "everything is fine" - a plain 200 on every request wouldn't
// catch the Aiven-sleeping-again case this project has already hit once.
export const check = async (req, res) => {
  try {
    await queryAsync("SELECT 1");
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "error",
      message: "Database unavailable",
      timestamp: new Date().toISOString(),
    });
  }
};
