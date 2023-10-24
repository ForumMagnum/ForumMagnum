import type { FilterTag } from './filterSettings';
import { getPublicSettings, getPublicSettingsLoaded, registeredSettings } from './settingsCache';

const getNestedProperty = function (obj: AnyBecauseTodo, desc: AnyBecauseTodo) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

export function initializeSetting(settingName: string, settingType: "server" | "public" | "instance")  {
  if (registeredSettings[settingName]) throw Error(`Already initialized a setting with name ${settingName} before.`)
  registeredSettings[settingName] = settingType
}

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
  }
  get(): SettingValueType {
    // eslint-disable-next-line no-console
    if (!getPublicSettingsLoaded()) throw Error(`Tried to access public setting ${this.settingName} before it was initialized`)
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


export const hideUnreviewedAuthorCommentsSettings = new DatabasePublicSetting<string | null>('hideUnreviewedAuthorComments', null) // Hide comments by unreviewed authors after date provided (prevents spam / flaming / makes moderation easier, but delays new user engagement)
export const cloudinaryCloudNameSetting = new DatabasePublicSetting<string>('cloudinary.cloudName', 'lesswrong-2-0') // Cloud name for cloudinary hosting

export const forumAllPostsNumDaysSetting = new DatabasePublicSetting<number>('forum.numberOfDays', 10) // Number of days to display in the timeframe view

export const nofollowKarmaThreshold = new DatabasePublicSetting<number>('nofollowKarmaThreshold', 10) // Users with less than this much karma have their links marked as nofollow

export const localeSetting = new DatabasePublicSetting<string>('locale', 'en-US')
export const legacyRouteAcronymSetting = new DatabasePublicSetting<string>('legacyRouteAcronym', 'lw') // Because the EA Forum was identical except for the change from /lw/ to /ea/

// frontpageFilterSettings default tag filter
//
// At the risk of premature future-proofing, this setting, which is initially
// here to allow the EA Forum to nudge down the visibility of posts with the
// Community tag, can be trivially applied to personalBlog, frontpage, and
// curated, if those ever get refactored into tags.
export const defaultVisibilityTags = new DatabasePublicSetting<Array<FilterTag>>('defaultVisibilityTags', [])

export const gatherTownRoomId = new DatabasePublicSetting<string | null>("gatherTownRoomId", "aPVfK3G76UukgiHx")
export const gatherTownRoomName = new DatabasePublicSetting<string | null>("gatherTownRoomName", "lesswrong-campus")

// Public elicit settings
export const elicitSourceURL = new DatabasePublicSetting('elicitSourceURL', 'https://LessWrong.com')
export const elicitSourceId = new DatabasePublicSetting('elicitSourceId', 'XCjOpumu-')

export const mapboxAPIKeySetting = new DatabasePublicSetting<string | null>('mapbox.apiKey', null) // API Key for the mapbox map and tile requests

export const mailchimpForumDigestListIdSetting = new DatabasePublicSetting<string | null>('mailchimp.forumDigestListId', null)
export const mailchimpEAForumListIdSetting = new DatabasePublicSetting<string | null>('mailchimp.eaForumListId', null)

export const isProductionDBSetting = new DatabasePublicSetting<boolean>('isProductionDB', false)

// You will need to restart your server after changing these at present;
// FrontpageReviewWidget reads them at startup.
export const annualReviewStart = new DatabasePublicSetting('annualReview.start', "2021-11-30")
// The following dates cut off their phase at the end of the day
export const annualReviewNominationPhaseEnd = new DatabasePublicSetting('annualReview.nominationPhaseEnd', "2021-12-14")
export const annualReviewReviewPhaseEnd = new DatabasePublicSetting('annualReview.reviewPhaseEnd', "2022-01-15")
export const annualReviewVotingPhaseEnd = new DatabasePublicSetting('annualReview.votingPhaseEnd', "2022-02-01")
export const annualReviewEnd = new DatabasePublicSetting('annualReview.end', "2022-02-06")
export const annualReviewAnnouncementPostPathSetting = new DatabasePublicSetting<string | null>('annualReview.announcementPostPath', null)

export const annualReviewVotingResultsPostPath = new DatabasePublicSetting<string>('annualReview.votingResultsPostPath', "")

export const moderationEmail = new DatabasePublicSetting<string>('moderationEmail', "ERROR: NO MODERATION EMAIL SET")
type AccountInfo = {
  username: string,
  email: string,
};
export const adminAccountSetting = new DatabasePublicSetting<AccountInfo|null>('adminAccount', null);

export const crosspostKarmaThreshold = new DatabasePublicSetting<number | null>('crosspostKarmaThreshold', 100);

export const ddTracingSampleRate = new DatabasePublicSetting<number>('datadog.tracingSampleRate', 100) // Sample rate for backend traces, between 0 and 100
export const ddRumSampleRate = new DatabasePublicSetting<number>('datadog.rumSampleRate', 100) // Sample rate for backend traces, between 0 and 100
export const ddSessionReplaySampleRate = new DatabasePublicSetting<number>('datadog.sessionReplaySampleRate', 100) // Sample rate for backend traces, between 0 and 100

export type CurrentEventHeader = {
  name: string,
  link: string,
}

export const currentEventHeader = new DatabasePublicSetting<CurrentEventHeader | null>("currentEventHeader", null);

/** TODO; doc */
export const hasDigestSetting = new DatabasePublicSetting<boolean>("hasDigest", false);

/** TODO; doc */
export const hasCommentOnSelectionSetting = new DatabasePublicSetting<boolean>("hasCommentOnSelection", true);

/** TODO; doc */
export const hasLogoSetting = new DatabasePublicSetting<boolean>("hasLogo", false);

/** TODO; doc */
export const communityNameSetting = new DatabasePublicSetting<String>("communityName", 'Community');

/** TODO; doc */
export const showCuratedSetting = new DatabasePublicSetting<boolean>("showCurated", false);

/** TODO; doc */
export const showCommunityMapSetting = new DatabasePublicSetting<boolean>("showCommunityMap", false);

// TODO: make this an instance setting if JP confirms that makes sense, because
// we'd need it in collections/users/schema and server/emails/renderEmail
/** whether this forum verifies user emails */
export const verifyEmailsSetting = new DatabasePublicSetting<boolean>("verifyEmails", true);

// TODO: make this an instance setting if JP confirms that makes sense
// /** main theme color, needed here for server/emails/renderEmail */
// export const mainThemeColorSetting = new DatabasePublicSetting<string>("mainThemeColor", "#5f9b65");

export const hasCookieConsentSetting = new DatabasePublicSetting<boolean>('hasCookieConsent', false);

export const showPersonalBlogpostIconSetting = new DatabasePublicSetting<boolean>('showPersonalBlogpostIcon', true);
export const showFirstPostReviewMessageSetting = new DatabasePublicSetting<boolean>('showFirstPostReviewMessage', true);

export const showTableOfContentsSetting = new DatabasePublicSetting<boolean>('showTableOfContents', true);
export const showReadingTimeSetting = new DatabasePublicSetting<boolean>('showReadingTime', true);
export const showAudioNodeSetting = new DatabasePublicSetting<boolean>('showAudioNode', true);

export const showSocialMediaShareLinksSetting = new DatabasePublicSetting<boolean>('showSocialMediaShareLinks', true);
