import isEmpty from 'lodash/isEmpty';
// We initialize these public settings to make it available on both the client and the server,
// but they get initialized via separate pathways on the client and on the server
// Server: See databaseSettings.ts in the server directory
// Client: See publicSettings.ts in the client directory
export const publicSettings:Record<string, any> = {}

const getNestedProperty = function (obj, desc) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

const registeredSettings:Record<string, boolean> = {}

export function initializeSetting(settingName: string)  {
  if (registeredSettings[settingName]) throw Error(`Already initialized a setting with name ${settingName} before.`)
  registeredSettings[settingName] = true
}
export class DatabasePublicSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType
  ) {
    initializeSetting(settingName)
  }
  get(): SettingValueType {
    // eslint-disable-next-line no-console
    if (isEmpty(publicSettings)) throw Error("Tried to access public setting before it was initialized")
    const cacheValue = getNestedProperty(publicSettings, this.settingName)
    if (typeof cacheValue === 'undefined') return this.defaultValue
    return cacheValue
  }
}

/*
  Public Database Settings
*/

export const googleTagManagerIdSetting = new DatabasePublicSetting<string | null>('googleTagManager.apiKey', null) // Google Tag Manager ID
export const reCaptchaSiteKeySetting = new DatabasePublicSetting<string | null>('reCaptcha.apiKey', null) // ReCaptcha API Key

// Algolia Search Settings
export const algoliaAppIdSetting = new DatabasePublicSetting<string | null>('algolia.appId', null)
export const algoliaSearchKeySetting = new DatabasePublicSetting<string | null>('algolia.searchKey', null)
export const algoliaPrefixSetting = new DatabasePublicSetting<string | null>('algolia.indexPrefix', null)

export const ckEditorUploadUrlSetting = new DatabasePublicSetting<string | null>('ckEditor.uploadUrl', null) // Image Upload URL for CKEditor
export const ckEditorWebsocketUrlSetting = new DatabasePublicSetting<string | null>('ckEditor.webSocketUrl', null) // Websocket URL for CKEditor (for collaboration)
export const logRocketApiKeySetting = new DatabasePublicSetting<string | null>('logRocket.apiKey', null) // LogRocket API Key
export const hasEventsSetting = new DatabasePublicSetting<boolean>('hasEvents', true) // Whether the current connected server has events activated

export const hideUnreviewedAuthorCommentsSettings = new DatabasePublicSetting<boolean>('hideUnreviewedAuthorComments', false) // Hide comments by unreviewed authors (prevents spam, but delays new user engagement)
export const cloudinaryCloudNameSetting = new DatabasePublicSetting<string>('cloudinary.cloudName', 'lesswrong-2-0') // Cloud name for cloudinary hosting

export const forumAllPostsNumDaysSetting = new DatabasePublicSetting<number>('forum.numberOfDays', 10) // Number of days to display in the timeframe view

export const localeSetting = new DatabasePublicSetting<string>('locale', 'en-US')
export const legacyRouteAcronymSetting = new DatabasePublicSetting<string>('legacyRouteAcronym', 'lw') // Because the EA Forum was identical except for the change from /lw/ to /ea/
