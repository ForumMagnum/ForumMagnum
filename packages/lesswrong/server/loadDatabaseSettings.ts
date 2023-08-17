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
  
  if (!isAnyTest && (!serverSettingsObject || !publicSettingsObject)) {
    // eslint-disable-next-line no-console
    console.error("Failed to load database settings from Postgres");
  }

  return {
    serverSettingsObject,
    publicSettingsObject,
    loadedDatabaseId,
  };
}

const loadDatabaseSettings = async (): Promise<DatabaseSettings> => {
  if (getSqlClient()) {
    try {
      // This needs to be awaited for it to be caught by the try/catch block
      return await loadDatabaseSettingsPostgres();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to load database settings from Postgres");
    }
  }
  return {
    serverSettingsObject: null,
    publicSettingsObject: null,
    loadedDatabaseId: null,
  };
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
