import { randomId } from "@/lib/random";
import ElectionVotes from "../../server/collections/electionVotes/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class ElectionVotesRepo extends AbstractRepo<"ElectionVotes"> {
  constructor() {
    super(ElectionVotes);
  }

  async submittedVoteCount(electionName: string): Promise<number> {
    const res = await this.getRawDb().oneOrNone<{ submitted_count: string }>(
      `
      SELECT COUNT(*) as submitted_count FROM "ElectionVotes" WHERE "electionName" = $1 AND "submittedAt" IS NOT NULL
    `,
      [electionName]
    );

    return res ? parseInt(res.submitted_count) : 0;
  }

  async upsertVote(
    electionName: string,
    userId: string,
    vote: Record<string, number>,
  ): Promise<void> {
    await this.none(`
      INSERT INTO "ElectionVotes" (
        "_id", "electionName", "userId", "vote", "submittedAt"
      ) VALUES (
        $1, $2, $3, $4, CURRENT_TIMESTAMP
      ) ON CONFLICT ("electionName", COALESCE("userId", '')) DO UPDATE SET
        "vote" = $4,
        "submittedAt" = CURRENT_TIMESTAMP
    `, [randomId(), electionName, userId, vote]);
  }
}

recordPerfMetrics(ElectionVotesRepo);

export default ElectionVotesRepo;
