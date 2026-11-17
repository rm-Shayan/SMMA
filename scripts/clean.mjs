/**
 * Removes generated build/test artifacts. Keeps source, .env files,
 * node_modules and the Python virtualenv untouched.
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  "apps/web/.next",
  "apps/web/out",
  "apps/web/dist",
  "apps/web/playwright-report",
  "apps/web/test-results",
  "apps/web/blob-report",
  ".turbo",
  "apps/web/.turbo",
  "node_modules/.cache",
  "apps/web/node_modules/.cache",
];

let removed = 0;

function remove(path) {
  if (!existsSync(path)) return;
  rmSync(path, { recursive: true, force: true });
  removed += 1;
  console.log(`removed ${path.replace(`${ROOT}\\`, "").replace(`${ROOT}/`, "")}`);
}

function removePycache(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) {
      if (entry === "__pycache__") remove(full);
      else removePycache(full);
    } else if (entry.endsWith(".pyc") || entry.endsWith(".pyo")) {
      rmSync(full, { force: true });
      removed += 1;
    }
  }
}

for (const target of targets) remove(join(ROOT, target));
removePycache(join(ROOT, "apps/api"));

console.log(removed === 0 ? "Nothing to clean." : `Cleaned ${removed} artifact(s).`);
