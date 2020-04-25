import { getSetting } from './vulcan-lib';
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