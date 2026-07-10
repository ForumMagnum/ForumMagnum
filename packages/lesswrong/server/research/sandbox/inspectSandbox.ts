/* eslint-disable no-console */
/**
 * Quick debug script: connects to an existing sandbox by id and runs probes
 * (file listing, supervisor process check, manual supervisor invocation) to
 * diagnose why the supervisor isn't responding on its port.
 *
 * Usage:
 *   yarn ts-node --swc -r tsconfig-paths/register --project tsconfig-repl.json \
 *     packages/lesswrong/server/research/sandbox/inspectSandbox.ts <sandboxName>
 */
import { Sandbox } from "@vercel/sandbox";

async function main() {
  const name = process.argv[2];
  if (!name) throw new Error("Usage: inspectSandbox.ts <sandboxName>");

  console.log(`[inspect] connecting to ${name}…`);
  const sandbox = await Sandbox.get({ name });
  console.log(`[inspect] status=${sandbox.status}`);

  console.log("\n[inspect] /vercel/sandbox listing:");
  const ls = await sandbox.runCommand({ cmd: "ls", args: ["-la", "/vercel/sandbox"] });
  console.log(await ls.stdout());

  console.log("\n[inspect] node -v:");
  const node = await sandbox.runCommand({ cmd: "node", args: ["-v"] });
  console.log(`  exit=${node.exitCode} out=${(await node.stdout()).trim()}`);

  console.log("\n[inspect] which claude:");
  const which = await sandbox.runCommand({ cmd: "which", args: ["claude"] });
  console.log(`  exit=${which.exitCode} out=${(await which.stdout()).trim()}`);

  console.log("\n[inspect] running processes:");
  const ps = await sandbox.runCommand({ cmd: "ps", args: ["-ef"] });
  console.log(await ps.stdout());

  console.log("\n[inspect] listeners on supervisor/auth-proxy/dev ports (9280/9281/9282):");
  const netstat = await sandbox.runCommand({ cmd: "sh", args: ["-c", "ss -tlnp 2>/dev/null | grep -E '9280|9281|9282' || echo '(no listeners on 9280/9281/9282)'"] });
  console.log(`  ${(await netstat.stdout()).trim()}`);

  console.log("\n[inspect] supervisor.log (if any):");
  const log = await sandbox.runCommand({ cmd: "sh", args: ["-c", "tail -40 ~/.research/supervisor.log 2>&1 || echo '(no log file)'"] });
  console.log(await log.stdout());

  console.log("\n[inspect] CALLBACK_TOKEN (env-grepped from supervisor process):");
  const env = await sandbox.runCommand({ cmd: "sh", args: ["-c", "cat /proc/$(pgrep -f supervisor.js)/environ 2>/dev/null | tr '\\0' '\\n' | grep -E '^(CALLBACK_TOKEN|BACKEND_BASE_URL|SANDBOX_ID)=' || echo '(supervisor env unreadable)'"] });
  console.log(await env.stdout());

  console.log("\n[inspect] done");
}

main().catch((err) => {
  console.error("[inspect] FAILED:", err);
  process.exit(1);
});
