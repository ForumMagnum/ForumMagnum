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
  
  addVote(_id: string, userId: string, left: number) {
    void this.none(`
      -- ForumEventsRepo.addVote
      UPDATE "ForumEvents"
      SET "publicData" = jsonb_set("publicData", array[$1], $2)
      WHERE "_id" = $3
    `, [userId, left, _id])
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
