import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import {
  postIdToCkEditorDocumentId,
  getCollaborationDetails,
  getStorageDocument,
  getAllRevisionsForDocument,
  fetchCkEditorCloudStorageDocumentHtml,
} from "@/server/ckEditor/ckEditorApi";
import fs from "fs";

const POST_ID = "9Bh9sAjtif82m4Jcm";

/**
 * Read-only: check what CkEditor's cloud still holds for a post whose edits
 * never made it into our Revisions table, and check whether the ckEditor
 * autosave webhook is working site-wide.
 */
export async function investigateLostDraftCkEditor(postId = POST_ID) {
  const db = getSqlClientOrThrow();
  const ckEditorId = postIdToCkEditorDocumentId(postId);
  /* eslint-disable no-console */
  console.log("ckEditorId:", ckEditorId);

  const sessions = await db.any(`
    -- investigateLostDraftCkEditor.sessions
    SELECT _id, "userId", "documentId", "createdAt", "endedAt", "endedBy"
    FROM "CkEditorUserSessions"
    WHERE "documentId" = $(ckEditorId) OR "documentId" = $(postId)
    ORDER BY "createdAt" DESC LIMIT 20
  `, { ckEditorId, postId });
  console.log("=== CK EDITOR USER SESSIONS ===\n", JSON.stringify(sessions, null, 2));

  // Is the ckEditor autosave webhook path alive site-wide?
  const autosaveHealth = await db.any(`
    -- investigateLostDraftCkEditor.autosaveHealth
    SELECT date_trunc('month', "editedAt") AS month,
           count(*) AS n,
           max("editedAt") AS most_recent
    FROM "Revisions"
    WHERE "commitMessage" = 'Cloud editor autosave'
      AND "editedAt" > now() - interval '18 months'
    GROUP BY 1 ORDER BY 1 DESC
  `);
  console.log("=== 'Cloud editor autosave' REVISIONS BY MONTH (site-wide) ===\n", JSON.stringify(autosaveHealth, null, 2));

  const lexicalHealth = await db.any(`
    -- investigateLostDraftCkEditor.lexicalHealth
    SELECT date_trunc('month', "editedAt") AS month, count(*) AS n
    FROM "Revisions"
    WHERE "commitMessage" = 'Collaborative editor autosave'
      AND "editedAt" > now() - interval '18 months'
    GROUP BY 1 ORDER BY 1 DESC
  `);
  console.log("=== 'Collaborative editor autosave' (lexical) BY MONTH ===\n", JSON.stringify(lexicalHealth, null, 2));

  for (const [label, fn] of [
    ["collaborations/details", () => getCollaborationDetails(ckEditorId)],
    ["storage document", () => getStorageDocument(ckEditorId)],
    ["cloud revisions", () => getAllRevisionsForDocument(ckEditorId)],
  ] as const) {
    try {
      const result = await fn();
      console.log(`=== CKEDITOR CLOUD: ${label} ===\n`, typeof result === "string" ? result.slice(0, 3000) : JSON.stringify(result, null, 2).slice(0, 3000));
    } catch (e) {
      console.log(`=== CKEDITOR CLOUD: ${label} — FAILED ===\n`, e instanceof Error ? e.message : e);
    }
  }

  try {
    const html = await fetchCkEditorCloudStorageDocumentHtml(ckEditorId);
    console.log(`=== CKEDITOR CLOUD HTML: length ${html.length} ===`);
    const path = `/private/tmp/claude-501/-Users-raymondarnold-Documents-coding-ForumMagnum/1dfb1a4e-27e1-462e-97b6-51c18e5455f5/scratchpad/ckeditor-cloud-${postId}.html`;
    fs.writeFileSync(path, html);
    console.log("Wrote cloud HTML to", path);
  } catch (e) {
    console.log("=== CKEDITOR CLOUD HTML — FAILED ===\n", e instanceof Error ? e.message : e);
  }
}

export default investigateLostDraftCkEditor;
