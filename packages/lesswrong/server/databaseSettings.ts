
import { DatabaseMetadata } from '../lib/collections/databaseMetadata/collection';
import { Meteor } from 'meteor/meteor';
import { publicSettings, initializeSetting, registeredSettings } from '../lib/publicSettings'
import { groupBy } from 'lodash';
import { importAllComponents } from '../lib/vulcan-lib/components';


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
  if (Meteor.isDevelopment) {
    setTimeout(() => {
      // We wait for 10 seconds to make sure all the settings have been initialized. This is not perfect but seems good enough
      validateSettings(registeredSettings, publicSettings, serverSettingsCache)
    }, 10000)
  }
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
    const cacheValue = getNestedProperty(serverSettingsCache, this.settingName)
    if (typeof cacheValue === 'undefined') return this.defaultValue
    return cacheValue
  }
}

const runValidateSettings = false

function validateSettings(registeredSettings:Record<string, "server" | "public" | "instance">, publicSettings:Record<string, any>, serverSettings:Record<string, any>) {
  if (runValidateSettings) {
    importAllComponents()
    Object.entries(registeredSettings).forEach(([key, value]) => {
      if (value === "server" && typeof getNestedProperty(serverSettings, key) === "undefined") {
        // eslint-disable-next-line no-console
        console.log(`Unable to find server database setting ${key} in serverSetting database object despite it being registered as a setting`)
      } else if (value === "public" && typeof getNestedProperty(publicSettings, key) === "undefined") {
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
  
}
