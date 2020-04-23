
import LRU from 'lru-cache';
import { DatabaseMetadata } from '../lib/collections/databaseMetadata/collection';

const settingsCache = new LRU({
  maxAge: 1000 * 60 * 5 // cache expiration is five minutes
})
class DatabaseSetting<SettingNameType extends keyof DatabaseSettingsTypes, SettingValueType> {
  settingName: SettingNameType;
  defaultValue: SettingValueType;
  initializationStatus: Promise<void>;
  constructor(settingName: SettingNameType, defaultValue:SettingValueType) {
    this.settingName = settingName
    this.defaultValue = defaultValue
    this.initializationStatus = this.init()
  }
  async init() {
    const { settingName, defaultValue } = this
    const databaseObject = await DatabaseMetadata.findOne({name: settingName})
    if (typeof databaseObject === "undefined") {
      DatabaseMetadata.insert({name: settingName, value: defaultValue})
    } else {
      const { value: databaseValue } = databaseObject
      settingsCache.set(settingName, databaseValue)
    }
    return
  }
  async get(): Promise<DatabaseSettingsTypes[SettingNameType]> {
    // Before we get anything, make sure that we are done initializing the setting
    await this.initializationStatus
    // Then try to get the value from cache
    const { settingName } = this
    const cacheValue = settingsCache.get(settingName)
    // If we can't find a value in the cache, we grab the setting from the database and repopulate the cache
    if (typeof cacheValue === 'undefined') {
      const {value: databaseValue} = await DatabaseMetadata.findOne({name: settingName})
      if (!databaseValue) throw Error(`Unable to find database value for database setting: ${settingName}`)
      
      settingsCache.set("settingName", databaseValue)
      return databaseValue
    } 
    return cacheValue
  }
}

export const databaseSettings = {
  mozillaHubsAPIKey: new DatabaseSetting("mozillaHubsAPIKey", null),
  mozillaHubsUserId: new DatabaseSetting("mozillaHubsUserId", null)
}

type DatabaseSettingsTypes = {
  mozillaHubsAPIKey: string | null,
  mozillaHubsUserId: string | null
}


