import { getSetting } from './vulcan-lib';
import { initializeSetting } from './publicSettings'

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

// Sentry settings
export const sentryUrlSetting = new PublicInstanceSetting<string|null>('sentry.url', null); // DSN URL
export const sentryEnvironmentSetting = new PublicInstanceSetting<string|null>('sentry.environment', null); // Environment, i.e. "development"
export const sentryReleaseSetting = new PublicInstanceSetting<string|null>('sentry.release', null) // Current release, i.e. hash of lattest commit
