import { Meteor } from 'meteor/meteor';

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

export const registerSetting = <T>(settingName: string, defaultValue: T, description?: string, isPublic?: boolean) => {
  if (settingName in Settings) {
    throw new Error(`Duplicate setting registration: ${settingName}`);
  }
  if (settingName in settingsUsedWithoutRegistration && (typeof defaultValue !== "undefined")) {
    //eslint-disable-next-line no-console
    console.log(`ERROR: Setting ${settingName} registered after having already been used`);
  }
  
  Settings[settingName] = { defaultValue, description, isPublic };
};

export const getSetting = <T>(settingName: string, settingDefault?: T): T => {

  let setting;

  // if a default value has been registered using registerSetting, use it
  if (typeof settingDefault === 'undefined' && Settings[settingName])
    settingDefault = Settings[settingName].defaultValue;

  // If this setting hasn't been registered, and is used here without a default
  // value specified, record the fact that it was used without registration.
  if (!(settingName in Settings) && (typeof settingDefault === undefined)) {
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
