import ReadStatuses from "../../lib/collections/readStatus/collection";
import { randomId } from "../../lib/random";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class ReadStatusesRepo extends AbstractRepo<"ReadStatuses"> {
  constructor() {
    super(ReadStatuses);
  }

  upsertReadStatus(userId: string, postId: string, isRead: boolean): Promise<DbReadStatus> {
    return this.one(`
      INSERT INTO "ReadStatuses" (
        "_id",
        "postId",
        "tagId",
        "userId",
        "isRead",
        "lastUpdated"
      ) VALUES (
        $(_id), $(postId), $(tagId), $(userId), $(isRead), $(lastUpdated)
      ) ON CONFLICT (
        COALESCE("postId", ''),
        COALESCE("userId", ''),
        COALESCE("tagId", '')
      )
      DO UPDATE SET
        "isRead" = $(isRead),
        "lastUpdated" = $(lastUpdated)
      RETURNING *
      `, {
      _id: randomId(),
      userId,
      postId,
      isRead,
      tagId: null,
      lastUpdated: new Date(),
    });
  }
}

recordPerfMetrics(ReadStatusesRepo);

export default ReadStatusesRepo;
