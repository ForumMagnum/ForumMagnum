import { setPublicSettings, getServerSettingsCache, setServerSettingsCache, registeredSettings } from '../../../lib/settingsCache';
import { getDatabase } from '../lib/mongoCollection';

export async function refreshSettingsCaches() {
  const db = getDatabase();
  if (db) {
    const table = db.collection("databasemetadata");
    // TODO: Do these two parallel to save a roundtrip
    const serverSettingsObject = await table.findOne({name: "serverSettings"})
    const publicSettingsObject  = await table.findOne({name: "publicSettings"})
    
    setServerSettingsCache(serverSettingsObject?.value || {__initialized: true});
    // We modify the publicSettings object that is made available in lib to allow both the client and the server to access it
    setPublicSettings(publicSettingsObject?.value || {__initialized: true});
  }
}
