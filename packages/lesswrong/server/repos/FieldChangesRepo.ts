import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { FieldChanges } from "../collections/fieldChanges/collection";

export interface ModerationRecordChange {
  recordId: string;
  actorId: string;
  createdAt: Date;
}

class FieldChangesRepo extends AbstractRepo<"FieldChanges"> {
  constructor() {
    super(FieldChanges);
  }

  async getModerationRecordChanges({ userIds, postIds, since, excludeActorId }: {
    userIds: string[];
    postIds: string[];
    since: Date;
    excludeActorId: string;
  }): Promise<ModerationRecordChange[]> {
    return this.getRawDb().any<ModerationRecordChange>(`
      -- FieldChangesRepo.getModerationRecordChanges
      WITH "trackedDocuments" AS (
        SELECT id AS "documentId", id AS "recordId" FROM unnest($(userIds)::text[] || $(postIds)::text[]) AS ids(id)
        UNION ALL SELECT "_id", "userId" FROM "Posts" WHERE "userId" = ANY($(userIds)::text[])
        UNION ALL SELECT "_id", "userId" FROM "Comments" WHERE "userId" = ANY($(userIds)::text[])
        UNION ALL SELECT "_id", "userId" FROM "ModeratorActions" WHERE "userId" = ANY($(userIds)::text[])
        UNION ALL SELECT "_id", "userId" FROM "UserRateLimits" WHERE "userId" = ANY($(userIds)::text[])
      )
      SELECT t."recordId", fc."userId" AS "actorId", fc."createdAt"
      FROM "trackedDocuments" t
      JOIN "FieldChanges" fc ON fc."documentId" = t."documentId"
      WHERE fc."createdAt" > $(since)
        AND fc."userId" IS NOT NULL
        AND fc."userId" <> $(excludeActorId)
    `, { userIds, postIds, since, excludeActorId });
  }
}

recordPerfMetrics(FieldChangesRepo);

export default FieldChangesRepo;
