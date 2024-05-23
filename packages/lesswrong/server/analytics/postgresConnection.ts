import { isAnyTest } from "../../lib/executionEnvironment";
import pgp, { IDatabase } from "pg-promise";
import type { IClient } from "pg-promise/typescript/pg-subset";
import { DatabaseServerSetting } from "../databaseSettings";
import { PublicInstanceSetting, isEAForum } from "../../lib/instanceSettings";
import { fs } from "mz";
import { forumSelect } from "../../lib/forumTypeUtils";
import { getInstanceSettingsFilePath } from "../commandLine";
import path from "path";

export const pgPromiseLib = pgp({});

export const connectionStringSetting = new DatabaseServerSetting<string | null>("analytics.connectionString", null);
export const mirrorConnectionSettingString = new DatabaseServerSetting<string | null>("analytics.mirrorConnectionString", null); //for streaming to two DB at once

interface SSLSettings {
  require?: boolean
  allowUnauthorized?: boolean
  ca?: string
}

const sslSetting = new DatabaseServerSetting<SSLSettings | null>(
  "analytics.ssl",
  forumSelect({
    EAForum: {
      require: true,
      allowUnauthorized: false,
    },
    default: null,
  })
);
/** Path of the certificate file *relative* to the instance settings file (so we don't have to store the full cert in instance settings) */
const sslCAFileSetting = new PublicInstanceSetting<string | null>(
  "analytics.caFilePath",
  forumSelect({ EAForum: "./certs/us-east-1-bundle.cer", default: null }),
  "optional"
);

const getFullCAFilePath = (): string | null => {
  const caFilePath = sslCAFileSetting.get();
  const instanceSettingsPath = getInstanceSettingsFilePath();

  if (!caFilePath || !instanceSettingsPath) {
    return null;
  }

  const instanceSettingsDirectory = path.dirname(instanceSettingsPath);
  return path.resolve(instanceSettingsDirectory, caFilePath);
}

export type AnalyticsConnectionPool = IDatabase<{}, IClient>;
let analyticsConnectionPools: Map<string, AnalyticsConnectionPool> = new Map();
let missingConnectionStringWarned = false;

function getAnalyticsConnectionFromString(connectionString: string | null): AnalyticsConnectionPool | null {
  if (isAnyTest && !isEAForum) {
    return null;
  }
  if (!connectionString) {
    if (!missingConnectionStringWarned) {
      missingConnectionStringWarned = true;
      if (!isAnyTest) {
        //eslint-disable-next-line no-console
        console.log("Analytics logging disabled: no analytics connectionString passed in");
      }
    }
    return null;
  }

  if (!analyticsConnectionPools.get(connectionString)) {
    let ssl = sslSetting.get()
    if (ssl) {
      const caFilePath = getFullCAFilePath()
      const ca = caFilePath ? fs.readFileSync(caFilePath).toString() : undefined

      ssl = {
        ...ssl,
        ...(ca && {ca})
      }
    }

    const connectionOptions = {
      connectionString: connectionString,
      ...(ssl && {ssl})
    };

    analyticsConnectionPools.set(connectionString, pgPromiseLib(connectionOptions));
  }

  return analyticsConnectionPools.get(connectionString)!
}

// Return the Analytics database connection pool, if configured. If no
// analytics DB is specified in the server config, returns null instead. The
// first time this is called, it will block briefly.
export const getAnalyticsConnection = (): AnalyticsConnectionPool | null => {
  // We make sure that the settingsCache is initialized before we access the connection strings
  const connectionString = connectionStringSetting.get();
  return getAnalyticsConnectionFromString(connectionString);
};

export const getAnalyticsConnectionOrThrow = (): AnalyticsConnectionPool => {
  const connection = getAnalyticsConnection();
  if (!connection) {
    throw new Error("No analytics DB configured");
  }
  return connection;
};

export const getMirrorAnalyticsConnection = (): AnalyticsConnectionPool | null => {
  // We make sure that the settingsCache is initialized before we access the connection strings
  const connectionString = mirrorConnectionSettingString.get();
  return getAnalyticsConnectionFromString(connectionString);
};
