import ElectionVotes from "../../lib/collections/electionVotes/collection";
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
}

recordPerfMetrics(ElectionVotesRepo);

export default ElectionVotesRepo;
