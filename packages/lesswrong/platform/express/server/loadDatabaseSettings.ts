import { setPublicSettings, getServerSettingsCache, setServerSettingsCache, registeredSettings } from '../../../lib/settingsCache';
import { getDatabase } from '../lib/mongoCollection';

let databaseIdPreloaded = false;
let preloadedDatabaseId: string|null = null;
export const getPreloadedDatabaseId = () => {
  return {
    preloaded: databaseIdPreloaded,
    databaseId: preloadedDatabaseId
  };
}

export async function refreshSettingsCaches() {
  const db = getDatabase();
  if (db) {
    const table = db.collection("databasemetadata");
    
    // Load serverSettings, publicSettings, and databaseId in parallel, so that
    // in development, server startup/restart doesn't have to wait for multiple
    // round trips to a remote database.
    const [serverSettingsObject, publicSettingsObject, loadedDatabaseId] = await Promise.all([
      await table.findOne({name: "serverSettings"}),
      await table.findOne({name: "publicSettings"}),
      await table.findOne({name: "databaseId"})
    ]);
    
    databaseIdPreloaded = true;
    preloadedDatabaseId = loadedDatabaseId?.value;
    
    setServerSettingsCache(serverSettingsObject?.value || {__initialized: true});
    // We modify the publicSettings object that is made available in lib to allow both the client and the server to access it
    setPublicSettings(publicSettingsObject?.value || {__initialized: true});
  }
}
