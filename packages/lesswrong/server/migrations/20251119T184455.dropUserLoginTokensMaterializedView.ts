import Users from "../collections/users/collection";
import { dropIndex, dropIndexByName } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await db.none(`DROP MATERIALIZED VIEW "UserLoginTokens"`);
  await db.none(`DROP FUNCTION fm_get_user_by_login_token`);
  await dropIndexByName(db, Users, "idx_Users_services_resume__haveLoginTokensToDelete");
  await dropIndexByName(db, Users, "idx_Users_services_resume__loginTokens");
  await dropIndexByName(db, Users, "idx_Users_services_resume__loginTokens__hashedToken");
  await dropIndexByName(db, Users, "idx_Users_services_resume__loginTokens__token");
  await dropIndexByName(db, Users, "idx_Users_services_resume__loginTokens__when");
  await dropIndexByName(db, Users, "idx_Users_services_resume__loginTokens__when");
}

export const down = async ({db}: MigrationContext) => {
}
