// One-command local run: creates .env.local if missing, starts the Docker MySQL,
// applies migrations and starts `next dev`. Usage: `pnpm dev:local`.
import { spawnSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ENV_FILE = ".env.local";
const LOCAL_DATABASE_URL = "mysql://dyc:dyc@127.0.0.1:3307/deploy_your_career";

function ensureEnvFile() {
  if (existsSync(ENV_FILE)) return;
  const secret = randomBytes(32).toString("base64");
  writeFileSync(
    ENV_FILE,
    [
      `DATABASE_URL=${LOCAL_DATABASE_URL}`,
      `BETTER_AUTH_SECRET=${secret}`,
      "BETTER_AUTH_URL=http://localhost:3000",
      "# Google sign-in (optional; set both or neither).",
      "GOOGLE_CLIENT_ID=",
      "GOOGLE_CLIENT_SECRET=",
      "",
    ].join("\n"),
  );
  console.log(`Created ${ENV_FILE} with a local DATABASE_URL and a generated BETTER_AUTH_SECRET.`);
}

function readEnvFile() {
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true, env });
  if (result.status !== 0) {
    console.error(`\n"${command} ${args.join(" ")}" failed (exit ${result.status}).`);
    process.exit(result.status ?? 1);
  }
}

ensureEnvFile();
const env = { ...process.env, ...readEnvFile() };

console.log("Starting MySQL (Docker)…");
run("docker", ["compose", "up", "-d", "--wait", "mysql"]);

console.log("Applying migrations…");
run("pnpm", ["exec", "drizzle-kit", "migrate"], env);

console.log("Starting the app at http://localhost:3000 — the magic link is printed in this console.");
const dev = spawn("pnpm", ["exec", "next", "dev"], { stdio: "inherit", shell: true, env: process.env });
dev.on("exit", (code) => process.exit(code ?? 0));
