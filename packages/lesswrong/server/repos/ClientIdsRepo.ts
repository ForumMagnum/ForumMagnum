import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { ClientIds } from "../../lib/collections/clientIds/collection";
import { randomId } from "../../lib/random";

class ClientIdsRepo extends AbstractRepo<"ClientIds"> {
  constructor() {
    super(ClientIds);
  }

  /**
   * Ensure the encountered clientId is recorded in the database, and add `userId` to the list of userIds if
   * it is not there already
   */
  async ensureClientId({ clientId, userId, referrer, landingPage }: { clientId: string; userId?: string; referrer: string | null; landingPage: string; }): Promise<void> {
    if (!userId) {
      await this.none(`
        INSERT INTO "ClientIds" ("_id", "clientId", "firstSeenReferrer", "firstSeenLandingPage")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("clientId") DO NOTHING;
      `, [randomId(), clientId, referrer, landingPage]);
    } else {
      await this.none(`
        INSERT INTO "ClientIds" ("_id", "clientId", "firstSeenReferrer", "firstSeenLandingPage", "userIds")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("clientId") DO UPDATE
        SET "userIds" = fm_add_to_set("ClientIds"."userIds", EXCLUDED."userIds"[1])
      `, [randomId(), clientId, referrer, landingPage, [userId]]);
    }
  }
}

recordPerfMetrics(ClientIdsRepo, { excludeMethods: ['ensureClientId'] });

export default ClientIdsRepo;
