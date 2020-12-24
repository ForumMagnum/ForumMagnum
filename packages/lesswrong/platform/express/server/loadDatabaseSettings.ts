import { setPublicSettings, getServerSettingsCache, setServerSettingsCache, registeredSettings } from '../../../lib/settingsCache';
import { getDatabase } from '../lib/mongoCollection';

export async function refreshSettingsCaches() {
  const db = getDatabase();
  if (db) {
    const table = db.collection("databasemetadata");
    const [serverSettingsObject, publicSettingsObject] = await Promise.all([
      await table.findOne({name: "serverSettings"}),
      await table.findOne({name: "publicSettings"})
    ]);
    
    setServerSettingsCache(serverSettingsObject?.value || {__initialized: true});
    // We modify the publicSettings object that is made available in lib to allow both the client and the server to access it
    setPublicSettings(publicSettingsObject?.value || {__initialized: true});
  }
}
