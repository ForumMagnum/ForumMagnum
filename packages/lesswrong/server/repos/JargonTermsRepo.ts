import AbstractRepo from "./AbstractRepo";
import JargonTerms from "@/server/collections/jargonTerms/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
import keyBy from "lodash/keyBy";

class JargonTermsRepo extends AbstractRepo<"JargonTerms"> {
  constructor() {
    super(JargonTerms);
  }

  /**
   * Gets the most recent instance of each jargon term used in any post by the author of the given post.
   */
  getAuthorsOtherJargonTerms(userId: string, postId: string) {
    return this.any(`
      SELECT DISTINCT ON (jt.term) jt.*
      FROM "JargonTerms" jt
      JOIN "Posts" p
      ON jt."postId" = p._id
      JOIN "Revisions" jtr
      ON jt.contents_latest = jtr._id
      WHERE p."userId" = $1
      AND jt.approved IS TRUE
      AND jt.deleted IS NOT TRUE
      AND jt."postId" != $2
      ORDER BY jt.term, jtr."editedAt" DESC
    `, [userId, postId]);
  }
  
  async getHumansAndOrAIEdited(botAccountId: string, documentIds: string[]): Promise<Array<"humans"|"AI"|"humansAndAI">> {
    const oldestAndNewestRevisionIds = await this.getRawDb().any(`
      -- JargonTermsRepo.getHumansAndOrAIEdited
      WITH newest_revisions AS (
        SELECT
          DISTINCT ON ("documentId")
          _id, "documentId", "userId"
        FROM "Revisions"
        WHERE "documentId" IN ($1:csv)
        ORDER BY "documentId", "createdAt" DESC
      ),
      oldest_revisions AS (
        SELECT
          DISTINCT ON ("documentId")
          _id, "documentId", "userId"
        FROM "Revisions"
        WHERE "documentId" IN ($1:csv)
        ORDER BY "documentId", "createdAt" ASC
      )
      SELECT
        n."documentId",
        n."userId" AS newest_revision_user_id,
        o."userId" AS oldest_revision_user_id
      FROM newest_revisions n
      JOIN oldest_revisions o ON n."documentId" = o."documentId"
      ORDER BY n."documentId";
    `, [documentIds]);
    const rowsById = keyBy(oldestAndNewestRevisionIds, r=>r.documentId);
    return documentIds.map((documentId: string) => {
      const { oldest_revision_user_id, newest_revision_user_id } = rowsById[documentId];
      const madeByAI = oldest_revision_user_id === botAccountId;
      const editedByHumans = newest_revision_user_id !== botAccountId;
      if (madeByAI && editedByHumans) {
        return "humansAndAI";
      } else if (!madeByAI && editedByHumans) {
        return "humans";
      } else {
        return "AI";
      }
    });
  }
}

recordPerfMetrics(JargonTermsRepo);

export default JargonTermsRepo;
