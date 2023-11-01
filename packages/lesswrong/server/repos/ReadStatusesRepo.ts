import ReadStatuses from "../../lib/collections/readStatus/collection";
import { randomId } from "../../lib/random";
import AbstractRepo from "./AbstractRepo";

export default class ReadStatusesRepo extends AbstractRepo<DbReadStatus> {
  constructor() {
    super(ReadStatuses);
  }

  upsertReadStatus(userId: string, postId: string, isRead: boolean): Promise<null> {
    // TODO: check if updating the userId column to NOT NULL also updates the corresponding `COALESCE` in the index definition
    // If so, figure out if we keep this to a zero-downtime migration where the ON CONFLICT call will always have a matching index
    // My hope is that it doesn't update it, and we can create a second index without the COALESCE
    return this.none(`
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