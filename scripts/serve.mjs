/**
 * Styre-BOT service orchestrator (no extra npm dependencies).
 *
 *   node scripts/serve.mjs <dev|start> [api|web|worker|all]
 *
 * Default service is `all` -> FastAPI + Next.js. `full` additionally starts
 * the background worker (also available via the dedicated *:worker scripts).
 *
 * Overrides: PORT (backend), WEB_PORT (frontend), PYTHON (python executable).
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MODE = process.argv[2] === "start" ? "start" : "dev";
const SERVICE = (process.argv[3] || "all").toLowerCase();
const IS_DEV = MODE === "dev";

const API_PORT = process.env.PORT || "8000";
const WEB_PORT = process.env.WEB_PORT || "3000";

const COLORS = {
  api: "\x1b[36m",
  worker: "\x1b[33m",
  web: "\x1b[35m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
};

const VALID_SERVICES = new Set(["api", "worker", "web", "all", "full"]);

if (!VALID_SERVICES.has(SERVICE)) {
  console.error(
    `Unknown service "${SERVICE}". Use one of: ${[...VALID_SERVICES].join(", ")}.`
  );
  process.exit(1);
}

const runs = (name) => {
  if (SERVICE === "full") return true;
  if (SERVICE === "all") return name !== "worker";
  return SERVICE === name;
};

function detectPython() {
  if (process.env.PYTHON) return process.env.PYTHON;

  const venv =
    process.platform === "win32"
      ? join(ROOT, "apps/api/.venv/Scripts/python.exe")
      : join(ROOT, "apps/api/.venv/bin/python");
  if (existsSync(venv)) return venv;

  return process.platform === "win32" ? "python" : "python3";
}

function prefix(stream, label, color, target) {
  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) target.write(`${color}[${label}]${COLORS.reset} ${line}\n`);
  });
  stream.on("end", () => {
    if (buffer) target.write(`${color}[${label}]${COLORS.reset} ${buffer}\n`);
  });
}

const nextCli = join(ROOT, "apps/web/node_modules/next/dist/bin/next");
if (runs("web") && !existsSync(nextCli)) {
  console.error(
    `${COLORS.dim}[setup]${COLORS.reset} Frontend dependencies are missing. Run \`pnpm install\` first.`
  );
  process.exit(1);
}

if (MODE === "start" && runs("web")) {
  const buildId = join(ROOT, "apps/web/.next/BUILD_ID");
  if (!existsSync(buildId)) {
    console.error(
      `${COLORS.dim}[setup]${COLORS.reset} Production build missing. Run \`pnpm run build\` first (or \`pnpm run preview\`).`
    );
    process.exit(1);
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

const occupied = [];
if (runs("api") && !(await isPortFree(Number(API_PORT)))) occupied.push(`backend :${API_PORT}`);
if (runs("web") && !(await isPortFree(Number(WEB_PORT)))) occupied.push(`frontend :${WEB_PORT}`);
if (occupied.length) {
  console.error(
    `Port already in use: ${occupied.join(", ")}.\n` +
      `Stop the existing dev server (Ctrl+C / type q in its terminal), or override:\n` +
      `  PORT=8100 WEB_PORT=3100 pnpm run dev`
  );
  process.exit(1);
}

const children = [];
let shuttingDown = false;

// uvicorn --reload spawns a child process; on Windows a plain child.kill()
// leaves that child listening on the port. Kill the whole process tree.
function killTree(child) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
      return;
    } catch {
      // Process may have already exited; fall through to the normal kill.
    }
  }
  if (!child.killed) child.kill("SIGTERM");
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = code;
  console.log(`\n${COLORS.dim}[styre]${COLORS.reset} Shutting down ${SERVICE}...`);
  for (const child of children) killTree(child);
  // A piped stdin (used by process managers / tests) keeps the event loop
  // alive, so guarantee the exit instead of relying on natural drain.
  process.stdin.pause();
  setTimeout(() => process.exit(code), 3000);
}

function launch(name, color, command, args, cwd, env = {}) {
  console.log(
    `${color}[${name}]${COLORS.reset} ${COLORS.dim}${command} ${args.join(" ")}${COLORS.reset}`
  );
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env, FORCE_COLOR: "1" },
    stdio: ["inherit", "pipe", "pipe"],
  });
  children.push(child);

  prefix(child.stdout, name, color, process.stdout);
  prefix(child.stderr, name, color, process.stderr);

  child.on("error", (err) => {
    console.error(`${color}[${name}]${COLORS.reset} failed to start: ${err.message}`);
    shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(
      `${color}[${name}]${COLORS.reset} exited (${signal ?? code}). Stopping the other services.`
    );
    shutdown(code ?? 1);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// Typing `q` + Enter is a reliable graceful stop on Windows, where a
// programmatic SIGINT is translated into a forceful process termination.
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  if (["q", "quit", "exit"].includes(chunk.trim().toLowerCase())) shutdown(0);
});

const python = detectPython();
const apiEnv = { PYTHONUNBUFFERED: "1" };

if (runs("api")) {
  const apiArgs = ["-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", API_PORT];
  if (IS_DEV) apiArgs.push("--reload");
  launch("api", COLORS.api, python, apiArgs, join(ROOT, "apps/api"), apiEnv);
}

if (runs("worker")) {
  launch("worker", COLORS.worker, python, ["-m", "app.worker.main"], join(ROOT, "apps/api"), apiEnv);
}

if (runs("web")) {
  launch(
    "web",
    COLORS.web,
    process.execPath,
    [nextCli, IS_DEV ? "dev" : "start", "-p", WEB_PORT],
    join(ROOT, "apps/web")
  );
}

console.log(
  `${COLORS.dim}[styre]${COLORS.reset} mode=${MODE} services=${SERVICE} api=http://localhost:${API_PORT} web=http://localhost:${WEB_PORT} (Ctrl+C or type \`q\` to stop)`
);
