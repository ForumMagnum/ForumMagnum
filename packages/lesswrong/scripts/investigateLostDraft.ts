import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

const POST_ID = "9Bh9sAjtif82m4Jcm";

/**
 * Read-only investigation of a post's revision history, to look for lost
 * draft edits. Covers Revisions, YjsDocuments (lexical collab state),
 * FieldChanges, and sibling/duplicate drafts by the same author.
 */
export async function investigateLostDraft(postId = POST_ID) {
  const db = getSqlClientOrThrow();
  /* eslint-disable no-console */

  const post = await db.any(`
    -- investigateLostDraft.post
    SELECT _id, "userId", title, slug, draft, "deletedDraft", af,
           "createdAt", "postedAt", "modifiedAt", "contents_latest"
    FROM "Posts" WHERE _id = $(postId)
  `, { postId });
  console.log("=== POST ===\n", JSON.stringify(post, null, 2));

  const revisions = await db.any(`
    -- investigateLostDraft.revisions
    SELECT _id, "fieldName", "editedAt", "createdAt", "autosaveTimeoutStart",
           "updateType", version, draft, "commitMessage", "userId",
           "originalContents"->>'type' AS contents_type,
           length("originalContents"->>'data') AS data_len,
           ("originalContents"->>'yjsState') IS NOT NULL AS has_yjs,
           length("originalContents"->>'yjsState') AS yjs_len,
           length(html) AS html_len,
           "wordCount", "changeMetrics"
    FROM "Revisions"
    WHERE "documentId" = $(postId)
    ORDER BY "editedAt" DESC
  `, { postId });
  console.log(`=== REVISIONS (${revisions.length}) ===\n`, JSON.stringify(revisions, null, 2));

  const yjs = await db.any(`
    -- investigateLostDraft.yjs
    SELECT _id, "collectionName", "documentId", "createdAt", "updatedAt",
           length("yjsState") AS yjs_state_bytes
    FROM "YjsDocuments" WHERE "documentId" = $(postId)
  `, { postId });
  console.log("=== YJS DOCUMENT ===\n", JSON.stringify(yjs, null, 2));

  const fieldChanges = await db.any(`
    -- investigateLostDraft.fieldChanges
    SELECT _id, "userId", "changeGroup", "documentId", "fieldName", "createdAt",
           left("oldValue"::text, 200) AS old_value,
           left("newValue"::text, 200) AS new_value
    FROM "FieldChanges"
    WHERE "documentId" = $(postId)
    ORDER BY "createdAt" DESC LIMIT 50
  `, { postId });
  console.log(`=== FIELD CHANGES (${fieldChanges.length}) ===\n`, JSON.stringify(fieldChanges, null, 2));

  const authorId = post[0]?.userId;
  if (authorId) {
    const siblingDrafts = await db.any(`
      -- investigateLostDraft.siblingDrafts
      SELECT _id, title, draft, "deletedDraft", "createdAt", "modifiedAt", "contents_latest"
      FROM "Posts"
      WHERE "userId" = $(authorId)
        AND "modifiedAt" > now() - interval '10 days'
      ORDER BY "modifiedAt" DESC LIMIT 30
    `, { authorId });
    console.log(`=== AUTHOR'S RECENT POSTS (${siblingDrafts.length}) ===\n`, JSON.stringify(siblingDrafts, null, 2));

    const recentRevs = await db.any(`
      -- investigateLostDraft.recentRevs
      SELECT r._id, r."documentId", p.title, r."editedAt", r.version, r.draft,
             r."commitMessage", r."wordCount", r."changeMetrics"
      FROM "Revisions" r
      LEFT JOIN "Posts" p ON p._id = r."documentId"
      WHERE r."userId" = $(authorId)
        AND r."collectionName" = 'Posts'
        AND r."editedAt" > now() - interval '4 days'
      ORDER BY r."editedAt" DESC LIMIT 60
    `, { authorId });
    console.log(`=== AUTHOR'S RECENT POST REVISIONS (${recentRevs.length}) ===\n`, JSON.stringify(recentRevs, null, 2));
  }

  return { post, revisions, yjs, fieldChanges };
}

export default investigateLostDraft;
