import { setPublicSettings, setServerSettingsCache } from '../lib/settingsCache';
import { getDatabase } from '../lib/mongoCollection';
import { DatabaseMetadataRepo } from "./repos";
import { getSqlClient } from '../lib/sql/sqlClient';
import { isAnyTest } from '../lib/executionEnvironment';

let databaseIdPreloaded = false;
let preloadedDatabaseId: string|null = null;
export const getPreloadedDatabaseId = () => {
  return {
    preloaded: databaseIdPreloaded,
    databaseId: preloadedDatabaseId
  };
}

type DatabaseSettings = {
  serverSettingsObject: DbDatabaseMetadata | null,
  publicSettingsObject: DbDatabaseMetadata | null,
  loadedDatabaseId: DbDatabaseMetadata | null,
}

const loadDatabaseSettingsPostgres = async (): Promise<DatabaseSettings> => {
  if (!isAnyTest) {
    // eslint-disable-next-line no-console
    console.log("Loading settings from Postgres...");
  }

  const repo = new DatabaseMetadataRepo();

  const [
    serverSettingsObject,
    publicSettingsObject,
    loadedDatabaseId,
  ] = await Promise.all([
    repo.getServerSettings(),
    repo.getPublicSettings(),
    repo.getDatabaseId(),
  ]);

  return {
    serverSettingsObject,
    publicSettingsObject,
    loadedDatabaseId,
  };
}

const loadDatabaseSettingsMongo = async (): Promise<DatabaseSettings> => {
  if (!isAnyTest) {
    // eslint-disable-next-line no-console
    console.log("Loading settings from Mongo...");
  }

  const db = getDatabase();
  if (!db) {
    return {
      serverSettingsObject: null,
      publicSettingsObject: null,
      loadedDatabaseId: null,
    };
  }

  const table = db.collection("databasemetadata");

  // Load serverSettings, publicSettings, and databaseId in parallel, so that
  // in development, server startup/restart doesn't have to wait for multiple
  // round trips to a remote database.
  const [
    serverSettingsObject,
    publicSettingsObject,
    loadedDatabaseId,
  ] = await Promise.all([
    await table.findOne({name: "serverSettings"}),
    await table.findOne({name: "publicSettings"}),
    await table.findOne({name: "databaseId"})
  ]);

  return {
    serverSettingsObject,
    publicSettingsObject,
    loadedDatabaseId,
  };
}

const loadDatabaseSettings = async (): Promise<DatabaseSettings> => {
  if (getSqlClient()) {
    // This is run very early on in server startup before collections have been
    // built (so we need to use raw queries) and, therefore, before we can check
    // DatabaseMetadata.isPostgres(), so we just try to read from Postgres first
    // and switch to Mongo if that fails.
    try {
      // This needs to be awaited for it to be caught by the try/catch block
      return await loadDatabaseSettingsPostgres();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to load database settings from Postgres - trying Mongo...");
      return await loadDatabaseSettingsMongo();
    }
  } else {
    return await loadDatabaseSettingsMongo();
  }
}

export const refreshSettingsCaches = async () => {
  const {
    serverSettingsObject,
    publicSettingsObject,
    loadedDatabaseId,
  } = await loadDatabaseSettings();

  databaseIdPreloaded = true;
  preloadedDatabaseId = loadedDatabaseId?.value;

  setServerSettingsCache(serverSettingsObject?.value || {__initialized: true});
  // We modify the publicSettings object that is made available in lib to allow both the client and the server to access it
  setPublicSettings(publicSettingsObject?.value || {__initialized: true});
}
