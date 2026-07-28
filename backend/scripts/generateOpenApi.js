// Writes the same document served at /api/openapi.json to a file, for
// tools that want a static artifact (Postman import, a docs site build
// step, committing a diffable snapshot) rather than hitting a running server.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateOpenApiDocument } from "../openapi/document.js";

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "openapi.json");
await writeFile(outPath, JSON.stringify(generateOpenApiDocument(), null, 2) + "\n");
console.log(`✅ Wrote ${outPath}`);
