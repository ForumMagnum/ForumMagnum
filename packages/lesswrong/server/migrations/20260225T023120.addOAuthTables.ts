import OAuthClients from "../collections/oAuthClients/collection";
import OAuthAuthorizationCodes from "../collections/oAuthAuthorizationCodes/collection";
import OAuthAccessTokens from "../collections/oAuthAccessTokens/collection";
import { createTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, OAuthClients);
  await createTable(db, OAuthAuthorizationCodes);
  await createTable(db, OAuthAccessTokens);
}

export const down = async ({db}: MigrationContext) => {
}
