import { setPublicSettings, getServerSettingsCache, setServerSettingsCache, registeredSettings } from '../../../lib/settingsCache';
import { DatabaseMetadata } from '../../../lib/collections/databaseMetadata/collection';

export const getPreloadedDatabaseId = () => ({
  preloaded: false,
  databaseId: null
});

export async function refreshSettingsCaches() {
  // Note: This is using Fibers to make this database call synchronous. This is kind of bad, but I don't know how to avoid it 
  // without doing tons of work to make everything work properly in an asynchronous context
  const serverSettingsObject = await DatabaseMetadata.findOne({name: "serverSettings"})
  const publicSettingsObject  = await DatabaseMetadata.findOne({name: "publicSettings"})
  
  setServerSettingsCache(serverSettingsObject?.value || {__initialized: true});
  // We modify the publicSettings object that is made available in lib to allow both the client and the server to access it
  setPublicSettings(publicSettingsObject?.value || {__initialized: true});
}
