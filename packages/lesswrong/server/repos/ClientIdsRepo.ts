import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { ClientIds } from "../../server/collections/clientIds/collection";
import { randomId } from "../../lib/random";
import groupBy from "lodash/groupBy";

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
  
  async isClientIdInvalidated(clientId: string): Promise<boolean> {
    const idObjs = await this.getRawDb().oneOrNone(`
      SELECT invalidated FROM "ClientIds"
      WHERE _id=$1
    `, [clientId]);
    return !!idObjs?.invalidated;
  }

  /**
   * Uses a LATERAL join so each userId probes the GIN index on `userIds` with a
   * constant single-element `@>` (the only form the planner will index): an
   * overlap (`&&`) or join-variable `@>` over the ~6.4M-row table falls back to
   * a full sequential scan and takes ~10-90s.
   */
  async getClientIdsForUsers(userIds: string[]): Promise<DbClientId[][]> {
    const rows = await this.getRawDb().any<DbClientId & { lookupUserId: string }>(`
      -- ClientIdsRepo.getClientIdsForUsers
      SELECT req."userId" AS "lookupUserId", c.*
      FROM unnest($1::text[]) AS req("userId")
      JOIN LATERAL (
        SELECT * FROM "ClientIds" c
        WHERE c."userIds" @> ARRAY[req."userId"]
        ORDER BY c."createdAt" DESC
        LIMIT 100
      ) c ON true
    `, [userIds]);
    const rowsByUser = groupBy(rows, (row) => row.lookupUserId);
    return userIds.map((userId) => rowsByUser[userId] ?? []);
  }
}

recordPerfMetrics(ClientIdsRepo, { excludeMethods: ['ensureClientId'] });

export default ClientIdsRepo;
