/* eslint-disable no-console */
/**
 * One-shot ops script to list and stop running Vercel sandboxes.
 *
 * Research conversations use persistent sandboxes: they idle-stop on their own
 * and auto-snapshot, and resume cleanly the next time their conversation is
 * used. Stopping one here just snapshots it early. The script exists to recover
 * spend from sandboxes left running by a crashed or incomplete provision,
 * before their idle timeout elapses.
 *
 * Run with:
 *   yarn research-sandbox-cleanup            # dry run — list only
 *   yarn research-sandbox-cleanup --all      # stop every running sandbox
 */
import { Sandbox } from "@vercel/sandbox";

async function main() {
  const stopAll = process.argv.includes("--all");

  console.log("[cleanup] listing sandboxes…");
  const sandboxes = await (await Sandbox.list()).toArray();

  if (sandboxes.length === 0) {
    console.log("[cleanup] no sandboxes found");
    return;
  }

  console.log(`[cleanup] found ${sandboxes.length} sandbox(es):`);
  for (const s of sandboxes) {
    console.log(`  - ${s.name}  status=${s.status}  createdAt=${new Date(s.createdAt).toISOString()}`);
  }

  if (!stopAll) {
    console.log(
      "\n[cleanup] dry run — pass --all to stop every running sandbox above. " +
      "Persistent sandboxes auto-snapshot on stop and resume on next use.",
    );
    return;
  }

  console.log("\n[cleanup] stopping running sandboxes…");
  for (const summary of sandboxes) {
    if (summary.status !== "running" && summary.status !== "pending") {
      console.log(`  - ${summary.name} skipped (status=${summary.status})`);
      continue;
    }
    try {
      // resume:false — we want to stop it, not boot a fresh session first.
      const sandbox = await Sandbox.get({ name: summary.name, resume: false });
      await sandbox.stop();
      console.log(`  - ${summary.name} stop requested`);
    } catch (err) {
      console.error(`  - ${summary.name} stop failed:`, (err as Error).message);
    }
  }

  console.log("[cleanup] done");
}

main().catch((err) => {
  console.error("[cleanup] FAILED:", err);
  process.exit(1);
});
