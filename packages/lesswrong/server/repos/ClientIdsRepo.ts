import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { ClientIds } from "../../server/collections/clientIds/collection";
import { randomId } from "../../lib/random";

class ClientIdsRepo extends AbstractRepo<"ClientIds"> {
  constructor() {
    super(ClientIds);
  }

  /**
   * Ensure the encountered clientId is recorded in the database, and add `userId` to the list of userIds if
   * it is not there already
   */
  async ensureClientId({ clientId, userId, referrer, landingPage }: { clientId: string; userId?: string; referrer: string | null; landingPage: string; }): Promise<{invalidated: boolean}> {
    if (!userId) {
      return await this.getRawDb().one<{invalidated: boolean}>(`
        INSERT INTO "ClientIds" ("_id", "clientId", "firstSeenReferrer", "firstSeenLandingPage", "lastSeenAt", "timesSeen")
        VALUES ($1, $2, $3, $4, NOW(), 1)
        ON CONFLICT ("clientId") DO UPDATE
        SET "lastSeenAt" = NOW(),
            "timesSeen" = "ClientIds"."timesSeen" + 1
        RETURNING invalidated;
      `, [randomId(), clientId, referrer, landingPage]);
    } else {
      return await this.getRawDb().one<{invalidated: boolean}>(`
        INSERT INTO "ClientIds" ("_id", "clientId", "firstSeenReferrer", "firstSeenLandingPage", "userIds", "lastSeenAt", "timesSeen")
        VALUES ($1, $2, $3, $4, $5, NOW(), 1)
        ON CONFLICT ("clientId") DO UPDATE
        SET "userIds" = fm_add_to_set("ClientIds"."userIds", EXCLUDED."userIds"[1]),
            "lastSeenAt" = NOW(),
            "timesSeen" = "ClientIds"."timesSeen" + 1
        RETURNING invalidated;
      `, [randomId(), clientId, referrer, landingPage, [userId]]);
    }
  }
}

recordPerfMetrics(ClientIdsRepo, { excludeMethods: ['ensureClientId'] });

export default ClientIdsRepo;
