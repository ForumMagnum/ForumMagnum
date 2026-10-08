/* eslint-disable no-console */
/**
 * Smoke test for @vercel/sandbox SDK integration.
 *
 * Provisions a sandbox, runs `echo hello`, exposes a port via `sandbox.domain(port)`,
 * starts a tiny HTTP responder inside the sandbox, hits its public URL from the host,
 * and tears down. Exists to surface API-shape issues before real integration work.
 *
 * Run with:
 *   yarn ts-node --swc -r tsconfig-paths/register --project tsconfig-repl.json \
 *     packages/lesswrong/server/research/sandbox/smokeTest.ts
 *
 * Requires Vercel auth in env (VERCEL_OIDC_TOKEN from `vercel env pull`,
 * or VERCEL_TOKEN+VERCEL_TEAM_ID+VERCEL_PROJECT_ID).
 */
import { Sandbox } from "@vercel/sandbox";
import { setTimeout as delay } from "timers/promises";

const PORT = 3000;

const RESPONDER_SCRIPT = `
const http = require('http');
const port = ${PORT};
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('smoke-ok ' + req.url + '\\n');
});
server.listen(port, '0.0.0.0', () => {
  console.log('responder listening on ' + port);
});
`;

async function main() {
  console.log("[smoke] creating sandbox...");
  const sandbox = await Sandbox.create({
    ports: [PORT],
    runtime: "node24",
    timeout: 5 * 60 * 1000,
    resources: { vcpus: 2 },
    persistent: false,
  });
  console.log(`[smoke] created: name=${sandbox.name} status=${sandbox.status}`);

  try {
    console.log("[smoke] echo hello");
    const echo = await sandbox.runCommand({
      cmd: "echo",
      args: ["hello"],
    });
    console.log(
      `[smoke] echo exitCode=${echo.exitCode} stdout=${(await echo.stdout()).trim()}`
    );
    if (echo.exitCode !== 0) throw new Error("echo failed");

    console.log("[smoke] writing responder script");
    await sandbox.writeFiles([
      { path: "/vercel/sandbox/responder.js", content: RESPONDER_SCRIPT },
    ]);

    console.log("[smoke] starting responder (detached)");
    await sandbox.runCommand({
      cmd: "node",
      args: ["/vercel/sandbox/responder.js"],
      detached: true,
    });

    const url = sandbox.domain(PORT);
    console.log(`[smoke] public URL: ${url}`);

    console.log("[smoke] waiting 2s for responder to bind");
    await delay(2000);

    let lastError: unknown = null;
    let body = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const res = await fetch(url + "/ping");
        body = await res.text();
        console.log(
          `[smoke] fetch attempt ${attempt}: status=${res.status} body=${body.trim()}`
        );
        if (res.ok && body.startsWith("smoke-ok")) {
          lastError = null;
          break;
        }
        lastError = new Error(`bad response: ${res.status} ${body}`);
      } catch (err) {
        lastError = err;
        console.log(`[smoke] fetch attempt ${attempt} threw: ${(err as Error).message}`);
      }
      await delay(1000);
    }
    if (lastError) throw lastError;

    console.log("[smoke] OK — sandbox round-trip works");
  } finally {
    console.log("[smoke] stopping sandbox");
    try {
      await sandbox.stop();
      console.log("[smoke] stopped");
    } catch (err) {
      console.error("[smoke] stop failed:", err);
    }
  }
}

main().catch((err) => {
  console.error("[smoke] FAILED:", err);
  process.exit(1);
});
