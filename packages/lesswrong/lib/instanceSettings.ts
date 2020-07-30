import { initializeSetting } from './publicSettings'
import { Meteor } from 'meteor/meteor'

const getNestedProperty = function (obj, desc) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

export const Settings: Record<string,any> = {};

// Keep track of which settings have been used (`getSetting`) without being
// registered (`registerSetting`). Registering settings is optional, but if a
// setting is registered with a default value after it has already been used
// without a default value, that's an error.
const settingsUsedWithoutRegistration: Record<string,boolean> = {};

const getSetting = <T>(settingName: string, settingDefault?: T): T => {

  let setting;

  // if a default value has been registered using registerSetting, use it
  if (typeof settingDefault === 'undefined' && Settings[settingName])
    settingDefault = Settings[settingName].defaultValue;

  // If this setting hasn't been registered, and is used here without a default
  // value specified, record the fact that it was used without registration.
  if (!(settingName in Settings) && (typeof settingDefault === 'undefined')) {
    settingsUsedWithoutRegistration[settingName] = true;
  }

  if (Meteor.isServer) {
    // look in public, private, and root
    const rootSetting = getNestedProperty(Meteor.settings, settingName);
    const privateSetting = Meteor.settings.private && getNestedProperty(Meteor.settings.private, settingName);
    const publicSetting = Meteor.settings.public && getNestedProperty(Meteor.settings.public, settingName);
    
    // if setting is an object, "collect" properties from all three places
    if (typeof rootSetting === 'object' || typeof privateSetting === 'object' || typeof publicSetting === 'object') {
      setting = {
        ...settingDefault,
        ...rootSetting,
        ...privateSetting,
        ...publicSetting,
      };
    } else {
      if (typeof rootSetting !== 'undefined') {
        setting = rootSetting;
      } else if (typeof privateSetting !== 'undefined') {
        setting = privateSetting;
      } else if (typeof publicSetting !== 'undefined') {
        setting = publicSetting;
      } else {
        setting = settingDefault;
      }
    }

  } else {
    // look only in public
    const publicSetting = Meteor.settings.public && getNestedProperty(Meteor.settings.public, settingName);
    setting = typeof publicSetting !== 'undefined' ? publicSetting : settingDefault;
  }

  // Settings[settingName] = {...Settings[settingName], settingValue: setting};

  return setting;

};

/* 
  A setting which is configured via Meteor's configuration system, ie in `settings.json`, as opposed to a database setting.

  For documentation on database settings, see `databaseSettings.ts`
  
  arguments: 
    settingName: JSON path to the setting in the settings.json file
    defaultValue: What value <Setting>.get() returns when no value is found in the JSON file
    settingType: 
      "warning": Logs a console warning when no value is provided in the settings.json path
      "required": Throws an error when no value is provided in the settings.json path
      "optional": No warnings or errors are logged when no value is provided in the specified settings.json path

  Method: 
    get: Returns the current value of the setting
*/
export class PublicInstanceSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType,
    private settingType: "optional" | "warning" | "required"
  ) {
    initializeSetting(settingName, "instance")
    if (Meteor.isDevelopment && settingType !== "optional") {
      const settingValue = getSetting(settingName)
      if (!settingValue) {
        if (settingType === "warning") {
          // eslint-disable-next-line no-console
          console.log(`No setting value provided for public instance setting for setting with name ${settingName} despite it being marked as warning`)
        }
        if (settingType === "required") {
          throw Error(`No setting value provided for public instance setting for setting with name ${settingName} despite it being marked as required`)
        } 
      }
    }
  }
  get(): SettingValueType {
    return getSetting(this.settingName, this.defaultValue)
  }
}

/*
  Public Instance Settings
*/

export const forumTypeSetting = new PublicInstanceSetting<string>('forumType', 'LessWrong', 'warning') // What type of Forum is being run, {LessWrong, AlignmentForum, EAForum}
export const forumTitleSetting = new PublicInstanceSetting<string>('title', 'LessWrong 2.0', 'warning') // Default title for URLs

// Your site name may be referred to as "The Alignment Forum" or simply "LessWrong". Use this setting to prevent something like "view on Alignment Forum". Leave the article uncapitalized ("the Alignment Forum") and capitalize if necessary.
export const siteNameWithArticleSetting = new PublicInstanceSetting<string>('siteNameWithArticle', "LessWrong", "warning")

export const hasEventsSetting = new PublicInstanceSetting<boolean>('hasEvents', true, 'optional') // Whether the current connected server has events activated

// Sentry settings
export const sentryUrlSetting = new PublicInstanceSetting<string|null>('sentry.url', null, "warning"); // DSN URL
export const sentryEnvironmentSetting = new PublicInstanceSetting<string|null>('sentry.environment', null, "warning"); // Environment, i.e. "development"
export const sentryReleaseSetting = new PublicInstanceSetting<string|null>('sentry.release', null, "warning") // Current release, i.e. hash of lattest commit
export const siteUrlSetting = new PublicInstanceSetting<string>('siteUrl', Meteor.absoluteUrl(), "optional")
