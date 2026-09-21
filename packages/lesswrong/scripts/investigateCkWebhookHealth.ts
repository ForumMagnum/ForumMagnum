import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

/**
 * Read-only: CkEditorUserSessions are written by the ckEditor webhook's
 * `collaboration.user.connected` handler, independently of autosave. If this
 * also drops to zero, the webhook itself is dead rather than ckEditor simply
 * being unused.
 */
export async function investigateCkWebhookHealth() {
  const db = getSqlClientOrThrow();
  /* eslint-disable no-console */

  const sessions = await db.any(`
    -- investigateCkWebhookHealth.sessions
    SELECT date_trunc('month', "createdAt") AS month, count(*) AS n, max("createdAt") AS most_recent
    FROM "CkEditorUserSessions"
    WHERE "createdAt" > now() - interval '14 months'
    GROUP BY 1 ORDER BY 1 DESC
  `);
  console.log("=== CKEDITOR USER SESSIONS BY MONTH (site-wide) ===\n", JSON.stringify(sessions, null, 2));
}

export default investigateCkWebhookHealth;
