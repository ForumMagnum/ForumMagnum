import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { ClientIds } from "../../lib/collections/clientIds/collection";
import { randomId } from "../../lib/random";

class ClientIdsRepo extends AbstractRepo<"ClientIds"> {
  constructor() {
    super(ClientIds);
  }

  async ensureClientId({ clientId, firstSeenReferrer, firstSeenLandingPage }: { clientId: string; firstSeenReferrer: string | null; firstSeenLandingPage: string; }): Promise<void> {
    // await this.none(`
    //   INSERT INTO "ClientIds" ("_id", "clientId", "firstSeenReferrer", "firstSeenLandingPage")
    //   VALUES ($1, $2, $3, $4)
    //   ON CONFLICT ("clientId") DO NOTHING;
    // `, [randomId(), clientId, firstSeenReferrer, firstSeenLandingPage]);

    // TODO Reinstate this more standard INSERT ... ON CONFLICT query above for ensuring only one instance of the
    // client id is stored, both queries do the same thing. The change in https://github.com/ForumMagnum/ForumMagnum/pull/9296
    // resulted in the unique index being on COALESCE("clientId", '') rather than "clientId" itself, which broke the
    // ON CONFLICT clause, this is just a quirk of the query builder and can be fixed.
    await this.none(`
      INSERT INTO "ClientIds" ("_id", "clientId", "firstSeenReferrer", "firstSeenLandingPage")
      SELECT $1, $2, $3, $4
      WHERE NOT EXISTS (
        SELECT 1 FROM "ClientIds"
        WHERE "clientId" = $2
      );
    `, [randomId(), clientId, firstSeenReferrer, firstSeenLandingPage]);
  }
}

recordPerfMetrics(ClientIdsRepo, { excludeMethods: ['ensureClientId'] });

export default ClientIdsRepo;
