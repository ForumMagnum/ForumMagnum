
import { DatabaseMetadata } from '../lib/collections/databaseMetadata/collection';
import { Meteor } from 'meteor/meteor';
import { publicSettings } from '../lib/publicSettings'

console.log("running databaseSettings.ts")
function getNestedProperty(obj, desc)  {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

let serverSettingsCache:Record<string, any> = {}
function refreshSettingsCaches() {
  // Note: This is using Fibers to make this database call synchronous. This is kind of bad, but I don't know how to avoid it 
  // without doing tons of work to make everything work properly in an asynchronous context
  const serverSettingsObject  = DatabaseMetadata.findOne({name: "serverSettings"})
  if (!serverSettingsObject) throw Error("Didn't find object with name 'serverSettings' in the DatabaseMetadataTable please add it to the DB")
  const publicSettingsObject  = DatabaseMetadata.findOne({name: "publicSettings"})
  if (!publicSettingsObject) throw Error("Didn't find object with name 'publicSettings' in the DatabaseMetadataTable please add it to the DB")
  // We modify the settingsCache object in place with the new values, to make sure that other files can safely import the cache
  serverSettingsCache = serverSettingsObject.value
  // We modify the publicSettings object that is made available in lib to allow both the client and the server to access it
  Object.assign(publicSettings, publicSettingsObject.value)
}

refreshSettingsCaches()
// We use Meteor.setInterval to make sure the code runs in a Fiber
Meteor.setInterval(refreshSettingsCaches, 1000 * 60 * 5) // We refresh the cache every 5 minutes on all servers

const registeredSettings:Record<string, boolean> = {}
export class DatabaseServerSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType
  ) {
    if (registeredSettings[settingName]) throw Error(`Already registered setting with name ${settingName} before`)
    registeredSettings[settingName] = true
  }
  get(): SettingValueType {
    // eslint-disable-next-line no-console
    const cacheValue = getNestedProperty(serverSettingsCache, this.settingName)
    if (typeof cacheValue === 'undefined') return this.defaultValue
    return cacheValue
  }
}
