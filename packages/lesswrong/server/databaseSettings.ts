import { DatabaseMetadata } from '../lib/collections/databaseMetadata/collection';
import { Meteor } from 'meteor/meteor';
import { publicSettings, initializeSetting, registeredSettings } from '../lib/publicSettings'
import groupBy from 'lodash/groupBy';
import get from 'lodash/get'
import { ensureIndex } from '../lib/collectionUtils';
import { assertDatabaseId } from './startupSanityChecks';
import * as _ from 'underscore';

let serverSettingsCache:Record<string, any> = {}
const runValidateSettings = false

ensureIndex(DatabaseMetadata, {
  name: 1
}, {
  unique: true
})
function refreshSettingsCaches() {
  // Note: This is using Fibers to make this database call synchronous. This is kind of bad, but I don't know how to avoid it 
  // without doing tons of work to make everything work properly in an asynchronous context
  const databaseSettingsObjects = DatabaseMetadata.find({name: {$in: ["serverSettings", "publicSettings", "databaseId"]}}).fetch();
  const serverSettingsObject = _.find(databaseSettingsObjects, s=>s.name==="serverSettings");
  const publicSettingsObject = _.find(databaseSettingsObjects, s=>s.name==="publicSettings");
  const databaseIdObject = _.find(databaseSettingsObjects, s=>s.name==="databaseId");
  if (!serverSettingsObject || !publicSettingsObject) {
    // eslint-disable-next-line no-console
    console.log("Settings not found");
  }
  
  serverSettingsCache = serverSettingsObject?.value || {__initialized: true}
  // We modify the publicSettings object that is made available in lib to allow both the client and the server to access it
  Object.assign(publicSettings, publicSettingsObject?.value || {__initialized: true})
  if (Meteor.isDevelopment && runValidateSettings) {
    // On development we validate the settings files, but wait 30 seconds to make sure that everything has really been loaded
    setTimeout(() => validateSettings(registeredSettings, publicSettings, serverSettingsCache), 30000)
  }
  
  assertDatabaseId(databaseIdObject);
}

refreshSettingsCaches()
// We use Meteor.setInterval to make sure the code runs in a Fiber
Meteor.setInterval(refreshSettingsCaches, 1000 * 60 * 5) // We refresh the cache every 5 minutes on all servers

export class DatabaseServerSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType
  ) {
    initializeSetting(settingName, "server")
  }
  get(): SettingValueType {
    // eslint-disable-next-line no-console
    const cacheValue = get(serverSettingsCache, this.settingName)
    if (typeof cacheValue === 'undefined') return this.defaultValue
    return cacheValue
  }
}

function validateSettings(registeredSettings:Record<string, "server" | "public" | "instance">, publicSettings:Record<string, any>, serverSettings:Record<string, any>) {
  Object.entries(registeredSettings).forEach(([key, value]) => {
    if (value === "server" && typeof get(serverSettings, key) === "undefined") {
      // eslint-disable-next-line no-console
      console.log(`Unable to find server database setting ${key} in serverSetting database object despite it being registered as a setting`)
    } else if (value === "public" && typeof get(publicSettings, key) === "undefined") {
      // eslint-disable-next-line no-console
      console.log(`Unable to find public database setting ${key} in publicSetting database object despite it being registered as a setting`)
    } 
  })
  Object.entries(serverSettings).forEach(([key, value]) => {
    if(typeof value === "object") {
      Object.keys(value).forEach(innerKey => {
        if (typeof registeredSettings[`${key}.${innerKey}`] === "undefined") {
          // eslint-disable-next-line no-console
          console.log(`Spurious setting provided in the server settings cache despite it not being registered: ${`${key}.${innerKey}`}`)
        }
      })
    } else if (typeof registeredSettings[key] === "undefined") {
      // eslint-disable-next-line no-console
      console.log(`Spurious setting provided in the server settings cache despite it not being registered: ${key}`)
    }
  })
  Object.entries(publicSettings).forEach(([key, value]) => {
    if (typeof value === "object") {
      Object.keys(value).forEach(innerKey => {
        if (typeof registeredSettings[`${key}.${innerKey}`] === "undefined") {
          // eslint-disable-next-line no-console
          console.log(`Spurious setting provided in the public settings cache despite it not being registered: ${`${key}.${innerKey}`}`)
        }
      })
    } else if (typeof registeredSettings[key] === "undefined") {
      // eslint-disable-next-line no-console
      console.log(`Spurious setting provided in the public settings cache despite it not being registered: ${key}`)
    }
  })
  // eslint-disable-next-line no-console
  console.log(groupBy(Object.keys(registeredSettings), key => registeredSettings[key]))
}
