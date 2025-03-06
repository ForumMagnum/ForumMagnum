import AbstractRepo from "./AbstractRepo";
import JargonTerms from "@/server/collections/jargonTerms/collection";
import { recordPerfMetrics } from "./perfMetricWrapper";
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
}

recordPerfMetrics(JargonTermsRepo);

export default JargonTermsRepo;
