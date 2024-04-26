import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { ClientIds } from "../../lib/collections/clientIds/collection";

// TODO decide one way or the other whether to keep this
class ClientIdsRepo extends AbstractRepo<"ClientIds"> {
  constructor() {
    super(ClientIds);
  }

  async ensureClientId({ clientId, firstSeenReferrer, firstSeenLandingPage }: { clientId: string; firstSeenReferrer: string | null; firstSeenLandingPage: string; }): Promise<void> {
    await this.getRawDb().query(`
      INSERT INTO "ClientIds" ("clientId", "firstSeenReferrer", "firstSeenLandingPage", "userIds")
      VALUES ($1, $2, $3, NULL)
      ON CONFLICT ("clientId") DO NOTHING;
    `, [clientId, firstSeenReferrer, firstSeenLandingPage]);
  }
}

recordPerfMetrics(ClientIdsRepo);

export default ClientIdsRepo;
