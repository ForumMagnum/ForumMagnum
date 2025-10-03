import {getPublicSettings, getPublicSettingsLoaded, initializeSetting} from './settingsCache'

const getNestedProperty = function (obj: AnyBecauseTodo, desc: AnyBecauseTodo) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

/* 
  A setting which is stored in the database in the "databasemedata" collection, in a record with the `name` field set to "publicSettings" 
  and the `value` field set to a JSON object with all the settings.

  SETTINGS REGISTERED HERE ARE SENT TO THE CLIENT AND ARE NOT PRIVATE. DO NOT USE PUBLIC SETTINGS TO STORE SECRETS. TO STORE SECRETS, USE
  `DatabaseServerSetting`, documented in `databaseSettings.ts`.
  
  For documentation on public instance settings, which are also sent to the client but can be customized per instance, see `instanceSettings.ts`
  
  arguments: 
    settingName: JSON path to the setting in the settings.json file
    defaultValue: What value <Setting>.get() returns when no value is found in the JSON file

  Method: 
    get: Returns the current value of the setting (either the value in the database or the default value)
*/
export class DatabasePublicSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType
  ) {
    initializeSetting(settingName, "public")

    // Affords for a more convenient lazy usage, 
    // so you can refer to setting getter as `setting.get` vs having to wrap it in a function like `() => setting.get()`
    this.get = this.get.bind(this)
    this.getOrThrow = this.getOrThrow.bind(this)
  }
  get(): SettingValueType {
    // eslint-disable-next-line no-console
    // TODO: come back to this when we get to the point where we need database settings available on the client
    // if (!getPublicSettingsLoaded()) throw Error(`Tried to access public setting ${this.settingName} before it was initialized`)
    const cacheValue = getNestedProperty(getPublicSettings(), this.settingName)
    if (typeof cacheValue === 'undefined') return this.defaultValue
    return cacheValue
  }

  getOrThrow(): SettingValueType {
    const value = this.get()
    if (value === null || value === undefined) throw Error(`Tried to access public setting ${this.settingName} but it was not set`)
    return value
  }
}


