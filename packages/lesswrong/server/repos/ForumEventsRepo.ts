import ForumEvents from "@/lib/collections/forumEvents/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class ForumEventsRepo extends AbstractRepo<"ForumEvents"> {
  constructor() {
    super(ForumEvents);
  }

  async submittedVoteCount(_id: string): Promise<number> {
    const res = await this.getRawDb().oneOrNone<{ count: string }>(`
      -- ForumEventsRepo.submittedVoteCount
      SELECT count(*) as count
      FROM public."ForumEvents", jsonb_each("publicData")
      WHERE _id = $1
    `, [_id])

    return res ? parseInt(res.count) : 0;
  }
  
  async getUserVote(_id: string, userId: string) {
    const res = await this.getRawDb().oneOrNone(`
      -- ForumEventsRepo.addVote
      SELECT "publicData"->$2 as vote
      FROM "ForumEvents"
      WHERE "_id" = $1
    `, [_id, userId])
    return res ? res.vote : null
  }
  
  addVote(_id: string, userId: string, voteData: AnyBecauseHard) {
    void this.none(`
      -- ForumEventsRepo.addVote
      UPDATE "ForumEvents"
      SET "publicData" = COALESCE("publicData", '{}'::jsonb) || $2
      WHERE "_id" = $1
    `, [_id, {[userId]: voteData}])
  }

  removeVote(_id: string, userId: string) {
    void this.none(`
      -- ForumEventsRepo.removeVote
      UPDATE "ForumEvents"
      SET "publicData" = "publicData" - $1
      WHERE "_id" = $2
    `, [userId, _id])
  }
}

recordPerfMetrics(ForumEventsRepo);

export default ForumEventsRepo;
