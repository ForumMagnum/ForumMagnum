import TypingIndicators from "../../lib/collections/typingIndicators/collection";
import {randomId} from "../../lib/random";
import AbstractRepo from "./AbstractRepo";

export default class TypingIndicatorsRepo extends AbstractRepo<DbTypingIndicator> {
  constructor() {
    super(TypingIndicators);
  }

  async upsertTypingIndicator(userId: string, documentId: string) {
    const now  = new Date()
    return this.none(`
      INSERT INTO "TypingIndicators" (
        "_id",
        "userId",
        "documentId",
        "lastUpdated"
      ) VALUES (
        $1, $2, $3, $4
      ) ON CONFLICT ("documentId", "userId") DO UPDATE SET 
        "lastUpdated" = $4
    `, [randomId(), userId, documentId, now])
  }
}
