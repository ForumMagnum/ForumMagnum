import { initializeSetting } from './publicSettings'
import { Meteor } from 'meteor/meteor'

export class PublicInstanceSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType
  ) {
    initializeSetting(settingName)
  }
  get(): SettingValueType {
    return getSetting(this.settingName, this.defaultValue)
  }
}

/*
  Public Instance Settings
*/

export const forumTypeSetting = new PublicInstanceSetting<string>('forumType', 'LessWrong') // What type of Forum is being run, {LessWrong, AlignmentForum, EAForum}
export const forumTitleSetting = new PublicInstanceSetting<string>('title', 'LessWrong 2.0') // Default title for URLs

// Your site name may be referred to as "The Alignment Forum" or simply "LessWrong". Use this setting to prevent something like "view on Alignment Forum". Leave the article uncapitalized ("the Alignment Forum") and capitalize if necessary.
export const siteNameWithArticleSetting = new PublicInstanceSetting<string>('siteNameWithArticle', "LessWrong")

// Sentry settings
export const sentryUrlSetting = new PublicInstanceSetting<string|null>('sentry.url', null); // DSN URL
export const sentryEnvironmentSetting = new PublicInstanceSetting<string|null>('sentry.environment', null); // Environment, i.e. "development"
export const sentryReleaseSetting = new PublicInstanceSetting<string|null>('sentry.release', null) // Current release, i.e. hash of lattest commit
export const siteUrlSetting = new PublicInstanceSetting<string>('siteUrl', Meteor.absoluteUrl())
export const mailUrlSetting = new PublicInstanceSetting<string | null>('mailUrl', null) // The SMTP URL used to send out email

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

// EA FORUM: registerSetting('introPostId', null, 'Post ID for the /intro route')
// This was a commented out setting that you use in the routes file. You will have to port it over to the new system.
