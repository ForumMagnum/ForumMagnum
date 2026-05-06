/**
 * One-shot script to list and stop orphaned Vercel sandboxes left over from
 * crashed/incomplete provisioning attempts. Sandboxes that never had their
 * supervisor process started will sit idle until they hit their timeout
 * (currently 1h per `DEFAULT_SANDBOX_TIMEOUT_MS`), so this is the only way to
 * recover the spend before that window elapses.
 *
 * With `--all` it also marks any matching `ResearchSandboxSessions` rows as
 * `status='stopped'` so the runtime doesn't keep handing them to clients.
 * (The `getOrCreateSandbox` self-healing path will eventually catch this on
 * its own, but updating here avoids a round of failed user requests.)
 *
 * Run with:
 *   yarn research-sandbox-cleanup            # dry run
 *   yarn research-sandbox-cleanup --all      # stop everything
 */
import { Sandbox } from "@vercel/sandbox";
import { Pool } from "pg";

async function main() {
  const stopAll = process.argv.includes("--all");

  console.log("[cleanup] listing sandboxes…");
  const { json: { sandboxes } } = await Sandbox.list();

  if (sandboxes.length === 0) {
    console.log("[cleanup] no sandboxes found");
    return;
  }

  console.log(`[cleanup] found ${sandboxes.length} sandbox(es):`);
  for (const s of sandboxes) {
    console.log(`  - ${s.id}  status=${s.status}  createdAt=${new Date(s.createdAt).toISOString()}`);
  }

  if (!stopAll) {
    console.log(
      "\n[cleanup] dry run — pass --all to stop every sandbox above. " +
      "Sandboxes will auto-stop at their per-instance timeout (default 1h) regardless.",
    );
    return;
  }

  console.log("\n[cleanup] stopping all sandboxes…");
  const stopped: string[] = [];
  for (const summary of sandboxes) {
    if (summary.status === "stopped" || summary.status === "stopping") {
      console.log(`  - ${summary.id} already ${summary.status}`);
      stopped.push(summary.id as string);
      continue;
    }
    try {
      const sandbox = await Sandbox.get({ sandboxId: summary.id as string });
      await sandbox.stop({ blocking: false });
      console.log(`  - ${summary.id} stop requested`);
      stopped.push(summary.id as string);
    } catch (err) {
      console.error(`  - ${summary.id} stop failed:`, (err as Error).message);
    }
  }

  if (stopped.length > 0 && process.env.PG_URL) {
    console.log(`\n[cleanup] marking ${stopped.length} ResearchSandboxSessions row(s) as stopped…`);
    const pool = new Pool({ connectionString: process.env.PG_URL });
    try {
      const res = await pool.query(
        `UPDATE "ResearchSandboxSessions"
         SET status = 'stopped'
         WHERE "vercelSandboxId" = ANY($1::text[])
           AND status NOT IN ('stopped')
         RETURNING _id, "vercelSandboxId"`,
        [stopped],
      );
      console.log(`[cleanup] updated ${res.rowCount} row(s)`);
    } finally {
      await pool.end();
    }
  } else if (stopped.length > 0) {
    console.log("\n[cleanup] PG_URL not set; skipping DB-row update. Runtime will self-heal on next access.");
  }

  console.log("[cleanup] done");
}

main().catch((err) => {
  console.error("[cleanup] FAILED:", err);
  process.exit(1);
});
