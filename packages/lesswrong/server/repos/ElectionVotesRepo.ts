import ElectionVotes from "../../lib/collections/electionVotes/collection";
import AbstractRepo from "./AbstractRepo";

export default class ElectionVotesRepo extends AbstractRepo<"ElectionVotes"> {
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
