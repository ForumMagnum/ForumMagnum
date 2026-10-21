import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

/**
 * Read-only dump of all non-deleted moderation templates (name, collection,
 * order, and plaintext-ish contents) for analyzing which templates could have
 * highlight rules built for them.
 */
export async function dumpModerationTemplates() {
  const db = getSqlClientOrThrow();
  /* eslint-disable no-console */

  const templates = await db.any(`
    -- dumpModerationTemplates.templates
    SELECT t._id, t.name, t."collectionName", t."order", t.deleted,
           r.html AS raw_contents, length(r.html) AS contents_len
    FROM "ModerationTemplates" t
    LEFT JOIN "Revisions" r ON r."_id" = t."contents_latest"
    WHERE t.deleted IS NOT TRUE
    ORDER BY t."collectionName", t."order" NULLS LAST, t.name
  `);

  for (const t of templates) {
    console.log("=".repeat(80));
    console.log(`NAME: ${t.name}`);
    console.log(`COLLECTION: ${t.collectionName} | ORDER: ${t.order} | LENGTH: ${t.contents_len}`);
    const text = (t.raw_contents ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    console.log(`CONTENT: ${text.slice(0, 1500)}`);
  }
  console.log(`\nTOTAL: ${templates.length} templates`);
}
