import { DatabaseMetadata } from '../lib/collections/databaseMetadata/collection';
import { isDevelopment } from '../lib/executionEnvironment';
import {
    getPublicSettings,
    getServerSettingsCache,
    getServerSettingsLoaded,
    initializeSetting,
    registeredSettings,
} from '../lib/settingsCache'
import groupBy from 'lodash/groupBy';
import get from 'lodash/get'
import { ensureIndex } from '../lib/collectionIndexUtils';

const runValidateSettings = false

if (isDevelopment && runValidateSettings) {
  // On development we validate the settings files, but wait 30 seconds to make sure that everything has really been loaded
  setTimeout(() => validateSettings(registeredSettings, getPublicSettings(), getServerSettingsCache()), 30000)
}

/* 
  A setting which is stored in the database in the "databasemetadata" collection, with the key "serverSettings"

  These settings are never sent to the client and so can be used for API secrets and other things that you never 
  want anyone but you to access.

  For documentation on public database settings, which are made available to the client (and so are not secret) see `publicSettings.ts`
  
  For documentation on public instance settings, which are also sent to the client but can be customized per instance, see `instanceSettings.ts`
  
  arguments: 
    settingName: JSON path to the setting in the settings.json file
    defaultValue: What value <Setting>.get() returns when no value is found in the JSON file

  Method: 
    get: Returns the current value of the setting (either the value in the database or the default value)
*/
export class DatabaseServerSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType
  ) {
    initializeSetting(settingName, "server")
  }
  get(): SettingValueType {
    if (!getServerSettingsLoaded())
      throw new Error("Requested database setting before settings loaded");
    // eslint-disable-next-line no-console
    const cacheValue = get(getServerSettingsCache(), this.settingName)
    if (typeof cacheValue === 'undefined') return this.defaultValue
    return cacheValue
  }
}

function validateSettings(registeredSettings: Record<string, "server" | "public" | "instance">, publicSettings: Record<string, any>, serverSettings: Record<string, any>) {
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

export const openAIApiKey = new DatabaseServerSetting<string|null>('languageModels.openai.apiKey', null);
export const openAIOrganizationId = new DatabaseServerSetting<string|null>('languageModels.openai.organizationId', null);

export const vertexDocumentServiceParentPathSetting = new DatabaseServerSetting<string | null>('googleVertex.documentServiceParentPath', null);
export const vertexUserEventServiceParentPathSetting = new DatabaseServerSetting<string | null>('googleVertex.userEventServiceParentPath', null);
export const vertexRecommendationServingConfigPathSetting = new DatabaseServerSetting<string | null>('googleVertex.recommendationServingConfigPath', null);
