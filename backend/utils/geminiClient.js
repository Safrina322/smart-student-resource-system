import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

// ES module imports are hoisted, so this module's top-level code can run
// before an importer's own dotenv.config() call - load it here directly
// (same self-contained pattern db.js/cloudinary.js use) rather than relying
// on import order elsewhere to have populated process.env first.
dotenv.config();

// gemini-flash-latest currently resolves to gemini-3.5-flash, which has a
// very low free-tier daily quota (20 req/day) on new accounts. The "lite"
// tier carries a separate, more generous free-tier quota bucket.
export const GEMINI_MODEL = "gemini-3.1-flash-lite";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default ai;
export { Type as SchemaType };
