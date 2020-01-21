import Vulcan from './config.js';

const getNestedProperty = function (obj, desc) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

export const Settings = {};

export const registerSetting = (settingName, defaultValue, description, isPublic) => {
  Settings[settingName] = { defaultValue, description, isPublic };
};

export const getSetting = (settingName, settingDefault) => {

  let setting;

  // if a default value has been registered using registerSetting, use it
  if (typeof settingDefault === 'undefined' && Settings[settingName])
    settingDefault = Settings[settingName].defaultValue;

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

registerSetting('debug', false, 'Enable debug mode (more verbose logging)');
