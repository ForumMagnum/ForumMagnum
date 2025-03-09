import AbstractRepo from "./AbstractRepo";
import ElectionCandidates from "../../server/collections/electionCandidates/collection";
import { getViewablePostsSelector } from "./helpers";
import { recordPerfMetrics } from "./perfMetricWrapper";

export type ElectionAmountRaised = {
  raisedForElectionFund: number,
  electionFundTarget: number,
  totalRaised: number,
  totalTarget: number,
}

class ElectionCandidatesRepo extends AbstractRepo<"ElectionCandidates"> {
  constructor() {
    super(ElectionCandidates);
  }

  async updatePostCounts(
    electionName: string,
    electionTagId: string,
  ): Promise<void> {
    await this.none(`
      -- ElectionCandidatesRepo.updatePostCounts
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

  async getAmountRaised(electionName: string): Promise<ElectionAmountRaised> {
    const result = await this.getRawDb().oneOrNone<ElectionAmountRaised>(`
      -- ElectionCandidatesRepo.getAmountRaised
      SELECT
        SUM(CASE WHEN "isElectionFundraiser" = TRUE THEN "amountRaised" ELSE 0 END) as "raisedForElectionFund",
        SUM(CASE WHEN "isElectionFundraiser" = TRUE THEN "targetAmount" ELSE 0 END) as "electionFundTarget",
        SUM("amountRaised") as "totalRaised",
        SUM("targetAmount") as "totalTarget"
      FROM "ElectionCandidates"
      WHERE "electionName" = $1
    `, [electionName]);

    return result ? {
      ...result,
      // We matched $5000 that isn't included in the amount we get from GWWC
      // TODO: remove the 5000 if we run another election
      raisedForElectionFund: result.raisedForElectionFund + 5_000,
      totalRaised: result.totalRaised + 5_000,
     } : {
      raisedForElectionFund: 0,
      electionFundTarget: 0,
      totalRaised: 0,
      totalTarget: 0,
    };
  }
}

recordPerfMetrics(ElectionCandidatesRepo);

export default ElectionCandidatesRepo;
