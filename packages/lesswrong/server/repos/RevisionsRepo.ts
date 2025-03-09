import Revisions from "@/server/collections/revisions/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class RevisionsRepo extends AbstractRepo<"Revisions"> {
  constructor() {
    super(Revisions);
  }

  async getRevisionsInTimeBlock(before: Date, after: Date) {
    return this.any(`
      SELECT r.*
      FROM "Revisions" r
      JOIN "Tags" t
      ON t."_id" = r."documentId"
      WHERE r."editedAt" < $1
      AND r."editedAt" > $2
      AND r."collectionName" = 'Tags' AND r."fieldName" = 'description'
      AND t."deleted" IS FALSE
      AND t."isPlaceholderPage" IS FALSE
      
      UNION ALL

      SELECT r.*
      FROM "Revisions" r
      JOIN "MultiDocuments" md
      ON md."_id" = r."documentId"
      -- If it's a lens or summary on a tag, try to get the parent tag
      LEFT JOIN "Tags" t
      ON t."_id" = md."parentDocumentId"
      -- If it's a summary on a lens, try to get the parent lens, then the parent tag
      LEFT JOIN "MultiDocuments" md2
      ON md2."_id" = md."parentDocumentId"
      LEFT JOIN "Tags" t2
      ON t2."_id" = md2."parentDocumentId"
      WHERE r."editedAt" < $1
      AND r."editedAt" > $2
      AND r."collectionName" = 'MultiDocuments' AND r."fieldName" = 'contents'
      AND COALESCE(t.deleted, t2.deleted) IS FALSE
      AND COALESCE(t."isPlaceholderPage", t2."isPlaceholderPage") IS FALSE
    `, [before, after]);
  }
}

recordPerfMetrics(RevisionsRepo);

export default RevisionsRepo;
