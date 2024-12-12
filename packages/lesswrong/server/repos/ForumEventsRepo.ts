import ForumEvents from "@/lib/collections/forumEvents/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class ForumEventsRepo extends AbstractRepo<"ForumEvents"> {
  constructor() {
    super(ForumEvents);
  }

  async getUserVote(_id: string, userId: string) {
    const res = await this.getRawDb().oneOrNone(`
      -- ForumEventsRepo.getUserVote
      SELECT "publicData"->$2 as vote
      FROM "ForumEvents"
      WHERE "_id" = $1
    `, [_id, userId])
    return res ? res.vote : null
  }

  addVote(_id: string, userId: string, voteData: Json) {
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

  // TODO these are currently exactly the same as above, refactor to support versioning
  async getUserSticker(_id: string, userId: string) {
    const res = await this.getRawDb().oneOrNone(`
      -- ForumEventsRepo.getUserVote
      SELECT "publicData"->$2 as vote
      FROM "ForumEvents"
      WHERE "_id" = $1
    `, [_id, userId])
    return res ? res.vote : null
  }

  async addSticker(_id: string, userId: string, voteData: Json) {
    return this.none(`
      -- ForumEventsRepo.addVote
      UPDATE "ForumEvents"
      SET "publicData" = COALESCE("publicData", '{}'::jsonb) || $2
      WHERE "_id" = $1
    `, [_id, {[userId]: voteData}])
  }

  async removeSticker(_id: string, userId: string) {
    return this.none(`
      -- ForumEventsRepo.removeVote
      UPDATE "ForumEvents"
      SET "publicData" = "publicData" - $1
      WHERE "_id" = $2
    `, [userId, _id])
  }
}

recordPerfMetrics(ForumEventsRepo);

export default ForumEventsRepo;
