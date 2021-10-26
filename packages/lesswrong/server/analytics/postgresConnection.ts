import { isAnyTest } from "../../lib/executionEnvironment";
import pgp, { IDatabase } from "pg-promise";
import { IClient } from "pg-promise/typescript/pg-subset";
import { DatabaseServerSetting } from "../databaseSettings";
import { forumTypeSetting } from "../../lib/instanceSettings";

export const pgPromiseLib = pgp({});

export const connectionStringSetting = new DatabaseServerSetting<string | null>("analytics.connectionString", null);

export type AnalyticsConnectionPool = IDatabase<{}, IClient>;
let analyticsConnectionPool: AnalyticsConnectionPool | null = null;
let missingConnectionStringWarned = false;

// Return the Analytics database connection pool, if configured. If no
// analytics DB is specified in the server config, returns null instead. The
// first time this is called, it will block briefly.
export const getAnalyticsConnection = (): AnalyticsConnectionPool | null => {
  // We make sure that the settingsCache is initialized before we access the connection strings
  const connectionString = connectionStringSetting.get();

  if (isAnyTest && forumTypeSetting.get() !== 'EAForum') {
    return null;
  }
  if (!connectionString) {
    if (!missingConnectionStringWarned) {
      missingConnectionStringWarned = true;
      //eslint-disable-next-line no-console
      console.log("Analytics logging disabled: analytics.connectionString is not configured");
    }
    return null;
  }
  if (!analyticsConnectionPool) analyticsConnectionPool = pgPromiseLib(connectionString);
  return analyticsConnectionPool;
};
