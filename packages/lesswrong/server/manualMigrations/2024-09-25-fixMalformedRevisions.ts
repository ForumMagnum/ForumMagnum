import chunk from "lodash/chunk";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { registerMigration } from "./migrationUtils";
import Revisions from "@/server/collections/revisions/collection";
import { getNextVersion } from "../editor/utils";

interface PostRevisionInfo {
  post_id: string;
  post_draft_status: boolean;
  post_created_at: Date;
  contents_latest_revision_id: string;
  contents_latest_revision_version: string;
  contents_latest_revision_edited_at: Date;
  contents_latest_revision_draft: boolean;
  last_attached_revision_version: string | null;
  last_attached_revision_edited_at: Date | null;
  last_attached_revision_draft: boolean | null;
}

export default registerMigration({
  name: "fixMalformedRevisions",
  dateWritten: "2024-09-25",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();

    const postIdsWithMalformedContentsLatestRevs = await db.any<PostRevisionInfo>(`
      SELECT
        p._id AS post_id,
        p.draft AS post_draft_status,
        p."createdAt" AS post_created_at,
        p.contents_latest AS contents_latest_revision_id,
        r.version AS contents_latest_revision_version,
        r."editedAt" AS contents_latest_revision_edited_at,
        r.draft AS contents_latest_revision_draft,
        last_attached.version AS last_attached_revision_version,
        last_attached."editedAt" AS last_attached_revision_edited_at,
        last_attached.draft AS last_attached_revision_draft
      FROM "Posts" p
      JOIN "Revisions" r ON p.contents_latest = r._id AND r."documentId" IS NULL
      LEFT JOIN LATERAL (
        SELECT
            r2.version,
            r2."editedAt",
            r2.draft,
            r2.html,
            r."originalContents"
        FROM "Revisions" r2
        WHERE r2."documentId" = p._id
        AND r2."fieldName" = 'contents'
        ORDER BY r2."editedAt" DESC
        LIMIT 1
      ) last_attached ON true
    `);

    // eslint-disable-next-line no-console
    console.log(`Found ${postIdsWithMalformedContentsLatestRevs.length} posts with malformed revisions`);

    let batchCount = 0;
    for (let batch of chunk(postIdsWithMalformedContentsLatestRevs, 100)) {
      batchCount++;
      // eslint-disable-next-line no-console
      console.log(`Processing batch ${batchCount} of ${Math.ceil(postIdsWithMalformedContentsLatestRevs.length / 100)}, ${batch.length} items in batch`);

      const bulkOperations: MongoBulkWriteOperation<DbRevision>[] = batch.map((item) => {
        const incrementedVersion = getNextVersion({ version: item.last_attached_revision_version } as DbRevision, 'patch', !!item.post_draft_status);

        const updatedFields = { documentId: item.post_id, draft: !!item.post_draft_status, version: incrementedVersion, fieldName: 'contents' };

        return {
          updateOne: {
            filter: { _id: item.contents_latest_revision_id, documentId: { $exists: false } },
            update: { $set: updatedFields }
          }
        }
      });

      await Revisions.rawCollection().bulkWrite(bulkOperations);
    }
  }
});
