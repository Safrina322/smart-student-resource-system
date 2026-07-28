// Standalone entry point for running migrations without booting the full
// app - useful as an explicit pre-deploy step.
import dotenv from "dotenv";
dotenv.config();

import { runMigrations } from "../migrations/runner.js";

await runMigrations();
process.exit(0);
