import TypingIndicators from "../../server/collections/typingIndicators/collection";
import {randomId} from "../../lib/random";
import AbstractRepo from "./AbstractRepo";

interface TypingIndicatorPostInfo extends DbTypingIndicator {
  postUserId: string,
  hasCoauthorPermission: DbPost['hasCoauthorPermission'],
  coauthorStatuses: DbPost['coauthorStatuses']
}
export default class TypingIndicatorsRepo extends AbstractRepo<"TypingIndicators"> {
  constructor() {
    super(TypingIndicators);
  }

  async upsertTypingIndicator(userId: string, documentId: string) {
    const now  = new Date()
    return this.none(`
      -- TypingIndicatorsRepo.upsertTypingIndicator
      INSERT INTO "TypingIndicators" (
        "_id",
        "userId",
        "documentId",
        "lastUpdated"
      ) VALUES (
        $1, $2, $3, $4
      ) ON CONFLICT ("documentId", "userId") DO UPDATE SET 
        "lastUpdated" = $4
    `, [randomId(), userId, documentId, now])
  }

  getRecentTypingIndicators(since: Date): Promise<TypingIndicatorPostInfo[]> {
    return this.getRawDb().any(`
      -- TypingIndicatorsRepo.getRecentTypingIndicators
      SELECT t.*, p."userId" as "postUserId", p."coauthorStatuses", p."hasCoauthorPermission"
      FROM "TypingIndicators" t
      JOIN "Posts" p
        ON t."documentId" = p._id 
      WHERE t."lastUpdated" > $1
    `, [since])
  }
}
