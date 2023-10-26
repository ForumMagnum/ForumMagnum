import AbstractRepo from "./AbstractRepo";
import ElectionCandidates from "../../lib/collections/electionCandidates/collection";
import { getViewablePostsSelector } from "./helpers";

export default class ElectionCandidatesRepo extends AbstractRepo<DbElectionCandidate> {
  constructor() {
    super(ElectionCandidates);
  }

  async updatePostCounts(
    electionName: string,
    electionTagId: string,
  ): Promise<void> {
    await this.none(`
      UPDATE "ElectionCandidates"
      SET "postCount" = (
        SELECT COUNT(*)
        FROM "Posts"
        WHERE
          ("tagRelevance"->$2)::INTEGER >= 1 AND
          ("tagRelevance"->"tagId")::INTEGER >= 1 AND
          ${getViewablePostsSelector()}
      )
      WHERE
        "electionName" = $1 AND
        "tagId" IS NOT NULL
    `, [electionName, electionTagId]);
  }
}
