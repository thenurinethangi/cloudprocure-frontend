import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const required = [".next/standalone/server.js", ".next/static", "public"];
for (const path of required) {
  await access(resolve(frontendRoot, path), constants.R_OK);
  console.log(`[OK] ${path}`);
}
console.log("Standalone frontend artifacts are complete.");
