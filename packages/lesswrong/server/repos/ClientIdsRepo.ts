import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { ClientIds } from "../../lib/collections/clientIds/collection";
import { randomId } from "../../lib/random";

class ClientIdsRepo extends AbstractRepo<"ClientIds"> {
  constructor() {
    super(ClientIds);
  }

  async ensureClientId({ clientId, firstSeenReferrer, firstSeenLandingPage }: { clientId: string; firstSeenReferrer: string | null; firstSeenLandingPage: string; }): Promise<void> {
    await this.none(`
      INSERT INTO "ClientIds" ("_id", "clientId", "firstSeenReferrer", "firstSeenLandingPage")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("clientId") DO NOTHING;
    `, [randomId(), clientId, firstSeenReferrer, firstSeenLandingPage]);
  }
}

recordPerfMetrics(ClientIdsRepo);

export default ClientIdsRepo;
