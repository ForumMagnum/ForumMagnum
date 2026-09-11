import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

const POST_ID = "9Bh9sAjtif82m4Jcm";
const USER_ID = "gYF9KQ2x5rXYBdDzS";

/**
 * Read-only: is anyone still editing ckEditor documents at all, and was the
 * author of the lost draft active on the site today?
 */
export async function investigateCkEditorUsage(postId = POST_ID, userId = USER_ID) {
  const db = getSqlClientOrThrow();
  /* eslint-disable no-console */

  const byType = await db.any(`
    -- investigateCkEditorUsage.byType
    SELECT date_trunc('month', "editedAt") AS month,
           "originalContents"->>'type' AS type,
           count(*) AS n
    FROM "Revisions"
    WHERE "collectionName" = 'Posts' AND "fieldName" = 'contents'
      AND "editedAt" > now() - interval '8 months'
    GROUP BY 1, 2 ORDER BY 1 DESC, 3 DESC
  `);
  console.log("=== POST CONTENT REVISIONS BY MONTH AND EDITOR TYPE ===\n", JSON.stringify(byType, null, 2));

  const ckSessions = await db.any(`
    -- investigateCkEditorUsage.ckSessions
    SELECT date_trunc('month', "createdAt") AS month, count(*) AS n, max("createdAt") AS most_recent
    FROM "CkEditorUserSessions"
    WHERE "createdAt" > now() - interval '12 months'
    GROUP BY 1 ORDER BY 1 DESC
  `);
  console.log("=== CKEDITOR USER SESSIONS BY MONTH (site-wide) ===\n", JSON.stringify(ckSessions, null, 2));

  const userActivity = await db.any(`
    -- investigateCkEditorUsage.userActivity
    SELECT name, count(*) AS n, max("createdAt") AS most_recent
    FROM "LWEvents"
    WHERE "userId" = $(userId) AND "createdAt" > now() - interval '3 days'
    GROUP BY 1 ORDER BY 3 DESC
  `, { userId });
  console.log("=== AUTHOR LWEVENTS, LAST 3 DAYS ===\n", JSON.stringify(userActivity, null, 2));

  const user = await db.any(`
    -- investigateCkEditorUsage.user
    SELECT _id, username, "displayName", "lastNotificationsCheck", "createdAt"
    FROM "Users" WHERE _id = $(userId)
  `, { userId });
  console.log("=== AUTHOR ===\n", JSON.stringify(user, null, 2));

  const sharing = await db.any(`
    -- investigateCkEditorUsage.sharing
    SELECT _id, "shareWithUsers", "sharingSettings", "collabEditorDialogue",
           "linkSharingKey" IS NOT NULL AS has_link_sharing_key,
           "linkSharingKeyUsedBy"
    FROM "Posts" WHERE _id = $(postId)
  `, { postId });
  console.log("=== POST SHARING SETTINGS ===\n", JSON.stringify(sharing, null, 2));
}

export default investigateCkEditorUsage;
