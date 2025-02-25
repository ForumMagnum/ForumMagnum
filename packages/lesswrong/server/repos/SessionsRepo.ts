import { Sessions } from "../../lib/collections/sessions/collection";
import AbstractRepo from "./AbstractRepo";

export type UpsertSessionData = Pick<DbSession, "_id" | "session" | "expires" | "lastModified">

export default class SessionsRepo extends AbstractRepo<"Sessions"> {
  constructor() {
    super(Sessions);
  }

  async upsertSession(session: UpsertSessionData): Promise<0|1> {
    const result = await this.getRawDb().one(`
      INSERT INTO "Sessions" (
        "_id",
        "session",
        "expires",
        "lastModified"
      ) VALUES (
        $(_id), 
        $(session), 
        $(expires),
        $(lastModified)
      ) ON CONFLICT (
        "_id"
      )
      DO UPDATE SET
        "session" = $(session),
        "expires" = $(expires),
        "lastModified" = $(lastModified)
      RETURNING CASE WHEN xmax::TEXT::INT > 0 THEN 'updated' ELSE 'inserted' END AS "action"
      `, session);

    return result.action === "inserted" ? 1 : 0;
  }
}
