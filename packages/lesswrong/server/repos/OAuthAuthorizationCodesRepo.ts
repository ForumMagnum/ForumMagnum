import { recordPerfMetrics } from "./perfMetricWrapper";
import AbstractRepo from "./AbstractRepo";
import OAuthAuthorizationCodes from "@/server/collections/oAuthAuthorizationCodes/collection";

class OAuthAuthorizationCodesRepo extends AbstractRepo<"OAuthAuthorizationCodes"> {
  constructor(sqlClient?: SqlClient) {
    super(OAuthAuthorizationCodes, sqlClient);
  }

  /**
   * Atomically mark an authorization code as used. Returns the code record if
   * it was successfully marked (i.e. it existed and had not been used yet), or
   * null if the code was already used or does not exist.
   */
  async markCodeAsUsed(hashedCode: string): Promise<DbOAuthAuthorizationCode | null> {
    return this.oneOrNone(`
      -- OAuthAuthorizationCodesRepo.markCodeAsUsed
      UPDATE "OAuthAuthorizationCodes"
      SET "used" = true
      WHERE "hashedCode" = $(hashedCode)
        AND "used" = false
      RETURNING *
    `, { hashedCode });
  }
}

recordPerfMetrics(OAuthAuthorizationCodesRepo);

export default OAuthAuthorizationCodesRepo;
