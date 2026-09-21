import { writeFile } from "node:fs/promises";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { collectionNameSchema, type LinkDocument, type StoredRevision, transformContents } from "./content";

/** Read-only. Exported for yarn repl; see README.md in this directory. */
export async function collectOvercomingBiasLinks(outputPath: string) {
  const db = getSqlClientOrThrow();
  const urls = new Set<string>();
  const documents: LinkDocument[] = [];
  const errors: Array<LinkDocument & { error: string }> = [];

  for (const collectionName of collectionNameSchema.options) {
    let afterId = "";
    while (true) {
      const batch = await db.any<{ _id: string; contents_latest: string | null }>(`
        -- collectOvercomingBiasLinks.documents
        SELECT _id, contents_latest FROM $(collectionName:name)
        WHERE _id > $(afterId) ORDER BY _id LIMIT 200
      `, { collectionName, afterId });
      if (!batch.length) break;
      const revisions = await db.any<StoredRevision>(`
        -- collectOvercomingBiasLinks.revisions
        SELECT r.* FROM $(collectionName:name) d
        LEFT JOIN LATERAL (
          SELECT _id FROM "Revisions"
          WHERE "documentId" = d._id AND "fieldName" = 'contents'
          ORDER BY "editedAt" DESC, _id DESC LIMIT 1
        ) newest ON true
        JOIN "Revisions" r ON r._id = d.contents_latest OR r._id = newest._id
        WHERE d._id IN ($(ids:csv))
          AND (r.html ILIKE '%overcomingbias.com%'
            OR r."originalContents"::text ILIKE '%overcomingbias.com%')
      `, { collectionName, ids: batch.map(document => document._id) });
      const affectedIds = new Set<string>();
      for (const revision of revisions) {
        if (!revision.documentId) continue;
        try {
          const contents = transformContents(revision);
          for (const url of contents.urls) urls.add(url);
          if (contents.urls.length) affectedIds.add(revision.documentId);
        } catch (error) {
          errors.push({ collectionName, documentId: revision.documentId, error: String(error) });
        }
      }
      for (const documentId of affectedIds) documents.push({ collectionName, documentId });
      afterId = batch[batch.length - 1]._id;
    }
  }
  const inventory = { urls: [...urls].sort(), documents, errors };
  await writeFile(outputPath, JSON.stringify(inventory, null, 2));
  return { urls: urls.size, documents: documents.length, errors: errors.length };
}
