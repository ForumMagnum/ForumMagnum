import { isServer, isDevelopment, isAnyTest, isE2E } from './executionEnvironment';
import { pluralize } from './vulcan-lib/pluralize';
import startCase from 'lodash/startCase' // AKA: capitalize, titleCase
import { TupleSet, UnionOf } from './utils/typeGuardUtils';
import {initializeSetting} from './settingsCache'
import { getInstanceSettings } from './getInstanceSettings';
import { getCommandLineArguments } from '@/server/commandLine';
import type { FilterTag } from './filterSettings';
import type { ReviewWinnerCategory, ReviewYear } from './reviewUtils';

const getNestedProperty = function (obj: AnyBecauseTodo, desc: AnyBecauseTodo) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

// Is any one of the arguments an object
const anyIsObject = (...args: any[]): boolean => {
  return args.some(a => typeof a === 'object' && !Array.isArray(a) && a !== null)
}

export const Settings: Record<string,any> = {};

const getSetting = <T>(settingName: string, settingDefault?: T): T => {

  let setting;
  const instanceSettings = getInstanceSettings();

  // if a default value has been registered using registerSetting, use it
  if (typeof settingDefault === 'undefined' && Settings[settingName])
    settingDefault = Settings[settingName].defaultValue;

  if (isServer) {
    // look in public, private, and root
    const rootSetting = getNestedProperty(instanceSettings, settingName);
    const privateSetting = instanceSettings.private && getNestedProperty(instanceSettings.private, settingName);
    const publicSetting = instanceSettings.public && getNestedProperty(instanceSettings.public, settingName);
    
    // if setting is an object, "collect" properties from all three places
    if (anyIsObject(rootSetting, privateSetting, publicSetting)) {
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
    const publicSetting = instanceSettings.public && getNestedProperty(instanceSettings.public, settingName);
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
class PublicInstanceSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType,
    private settingType: "optional" | "warning" | "required"
  ) {
    initializeSetting(settingName, "instance")
    if (isDevelopment && settingType !== "optional") {
      const settingValue = getSetting(settingName)
      if (typeof settingValue === 'undefined') {
        if (settingType === "warning") {
          if (!isAnyTest) {
            // eslint-disable-next-line no-console
            console.log(`No setting value provided for public instance setting for setting with name ${settingName} despite it being marked as warning`)
          }
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

export const allForumTypes = new TupleSet(["LessWrong","AlignmentForum","EAForum"] as const);
export type ForumTypeString = UnionOf<typeof allForumTypes>;
export const forumTypeSetting = new PublicInstanceSetting<ForumTypeString>('forumType', 'LessWrong', 'warning') // What type of Forum is being run, {LessWrong, AlignmentForum, EAForum}

export const isLW = forumTypeSetting.get() === "LessWrong"
export const isEAForum = forumTypeSetting.get() === "EAForum"
export const isAF = forumTypeSetting.get() === "AlignmentForum"
export const isLWorAF = isLW || isAF

export const forumTitleSetting = new PublicInstanceSetting<string>('title', 'LessWrong', 'warning') // Default title for URLs

// Your site name may be referred to as "The Alignment Forum" or simply "LessWrong". Use this setting to prevent something like "view on Alignment Forum". Leave the article uncapitalized ("the Alignment Forum") and capitalize if necessary.
export const siteNameWithArticleSetting = new PublicInstanceSetting<string>('siteNameWithArticle', "LessWrong", "warning")

/**
 * Name of the tagging feature on your site. The EA Forum is going to try
 * calling them topics. You should set this setting with the lowercase singular
 * form of the name. We assume this is a single word currently. Spaces will
 * cause issues.
 */
export const taggingNameSetting = new PublicInstanceSetting<string>('taggingName', 'tag', 'optional')
export const taggingNameCapitalSetting = {get: () => startCase(taggingNameSetting.get())}
export const taggingNamePluralSetting = {get: () => pluralize(taggingNameSetting.get())}
export const taggingNamePluralCapitalSetting = {get: () => pluralize(startCase(taggingNameSetting.get()))}
export const taggingNameIsSet = {get: () => taggingNameSetting.get() !== 'tag'}
export const taggingNameIsPluralized = {get: () => !isLWorAF && taggingNameIsSet.get()};
export const taggingNameCapitalizedWithPluralizationChoice = { get: () => {
  if (taggingNameIsPluralized.get()) {
    return taggingNamePluralCapitalSetting.get();
  }
  return taggingNameCapitalSetting.get();
}};

/** 
 * If set, this defines the "path part" previously occupied by "tag" in tag-related urls.
 * This allows the url for tags to be something other than the tag name, e.g. LessWrong is setting this to "w".
 * External consumers should use `tagUrlBaseSetting`, which defaults to taggingNameSetting (with or without pluralization).
 */
const taggingUrlCustomBaseSetting = new PublicInstanceSetting<string|null>('taggingUrlCustomBase', null, 'optional')
export const tagUrlBaseSetting = {get: () => {
  const customBase = taggingUrlCustomBaseSetting.get();
  if (customBase) {
    return customBase;
  }
  if (taggingNameIsPluralized.get()) {
    return taggingNamePluralSetting.get();
  }
  return taggingNameSetting.get();
}}

// NB: Now that neither LW nor the EAForum use this setting, it's a matter of
// time before it falls out of date. Nevertheless, I expect any newly-created
// forums to use this setting.
export const hasEventsSetting = new PublicInstanceSetting<boolean>('hasEvents', true, 'optional') // Whether the current connected server has events activated

export const hasRejectedContentSectionSetting = new PublicInstanceSetting<boolean>('hasRejectedContentSection', false, 'optional');

// Sentry settings
export const sentryUrlSetting = new PublicInstanceSetting<string|null>('sentry.url', null, "warning"); // DSN URL
export const sentryEnvironmentSetting = new PublicInstanceSetting<string|null>('sentry.environment', null, "warning"); // Environment, i.e. "development"
export const sentryReleaseSetting = new PublicInstanceSetting<string|null>('sentry.release', null, "warning") // Current release, i.e. hash of lattest commit
const getDefaultAbsoluteUrl = (): string => {
  if (defaultSiteAbsoluteUrl?.length>0) {
    return defaultSiteAbsoluteUrl;
  } else {
    return `http://localhost:${getCommandLineArguments().localhostUrlPort}/`
  }
}
export const siteUrlSetting = new PublicInstanceSetting<string>('siteUrl', getDefaultAbsoluteUrl(), "optional")

// FM Crossposting
export const fmCrosspostSiteNameSetting = new PublicInstanceSetting<string|null>("fmCrosspost.siteName", null, "optional");
export const fmCrosspostBaseUrlSetting = new PublicInstanceSetting<string|null>("fmCrosspost.baseUrl", null, "optional");

// For development, there's a matched set of CkEditor settings as instance
// settings, which take precedence over the database settings. This allows
// using custom CkEditor settings that don't match what's in the attached
// database.
export const ckEditorUploadUrlOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.uploadUrl', null, "optional") // Image Upload URL for CKEditor
export const ckEditorWebsocketUrlOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.webSocketUrl', null, "optional") // Websocket URL for CKEditor (for collaboration)

// Stripe setting

//Test vs Production Setting
export const testServerSetting = new PublicInstanceSetting<boolean>("testServer", false, "warning")

export const disableEnsureIndexSetting = new PublicInstanceSetting<boolean>("disableEnsureIndex", false, "optional");

/** Currently LW-only; forum-gated in `userCanVote` */
export const lowKarmaUserVotingCutoffDateSetting = new PublicInstanceSetting<string>("lowKarmaUserVotingCutoffDate", "11-30-2022", "optional");
/** Currently LW-only; forum-gated in `userCanVote` */
export const lowKarmaUserVotingCutoffKarmaSetting = new PublicInstanceSetting<number>("lowKarmaUserVotingCutoffKarma", 1, "optional");

/** Whether posts and other content is visible to non-logged-in users (TODO: actually implement this) */
export const publicAccess = new PublicInstanceSetting<boolean>("publicAccess", true, "optional");

/** Header-related settings */
export const taglineSetting = new PublicInstanceSetting<string>('tagline', "A community blog devoted to refining the art of rationality", "warning")
export const faviconUrlSetting = new PublicInstanceSetting<string>('faviconUrl', '/img/favicon.ico', "warning")
export const faviconWithBadgeSetting = new PublicInstanceSetting<string|null>('faviconWithBadge', null, "optional")
export const tabTitleSetting = new PublicInstanceSetting<string>('forumSettings.tabTitle', 'LessWrong', "warning")
export const tabLongTitleSetting = new PublicInstanceSetting<string | null>('forumSettings.tabLongTitle', null, "optional")

export const noIndexSetting = new PublicInstanceSetting<boolean>('noindex', false, "optional")

/** Whether this forum verifies user emails */
export const verifyEmailsSetting = new PublicInstanceSetting<boolean>("verifyEmails", !isEAForum, "optional");

export const hasCuratedPostsSetting = new PublicInstanceSetting<boolean>("hasCuratedPosts", false, "optional");

export const performanceMetricLoggingEnabled = new PublicInstanceSetting<boolean>('performanceMetricLogging.enabled', false, "optional");
export const performanceMetricLoggingBatchSize = new PublicInstanceSetting<number>('performanceMetricLogging.batchSize', 100, "optional");
export const performanceMetricLoggingSqlSampleRate = new PublicInstanceSetting<number>('performanceMetricLogging.sqlSampleRate', 0.05, "optional");

export const hasSideCommentsSetting = new PublicInstanceSetting<boolean>("comments.sideCommentsEnabled", isLWorAF, "optional");
export const hasCommentsTableOfContentSetting = new PublicInstanceSetting<boolean>("comments.tableOfContentsEnabled", isLWorAF, "optional");
export const hasDialoguesSetting = new PublicInstanceSetting<boolean>("dialogues.enabled", true, "optional");
export const hasPostInlineReactionsSetting = new PublicInstanceSetting<boolean>("posts.inlineReactionsEnabled", isLWorAF, "optional");

const disableElastic = new PublicInstanceSetting<boolean>(
  "disableElastic",
  false,
  "optional",
);

export const isElasticEnabled = !isAnyTest && !isE2E && !disableElastic.get();

export const requireReviewToFrontpagePostsSetting = new PublicInstanceSetting<boolean>('posts.requireReviewToFrontpage', !isEAForum, "optional")
export const eaFrontpageDateDefault = (
  isEvent?: boolean,
  submitToFrontpage?: boolean,
  draft?: boolean,
) => {
  if (isEvent || !submitToFrontpage || draft) {
    return null;
  }
  return new Date();
}

export const manifoldAPIKeySetting = new PublicInstanceSetting<string | null>('manifold.reviewBotKey', null, "optional")
export const reviewUserBotSetting = new PublicInstanceSetting<string | null>('reviewBotId', null, "optional")

/** Karma threshold upon which we automatically create a market for whether this post will be a winner in the review for its year */
export const reviewMarketCreationMinimumKarmaSetting = new PublicInstanceSetting<number>('annualReviewMarket.marketCreationMinimumKarma', 100, "optional");
/** Minimum market odds required to highlight this post (e.g. make its karma gold) as a potential review winner */
export const highlightReviewWinnerThresholdSetting = new PublicInstanceSetting<number>('annualReviewMarket.highlightReviewWinnerThreshold', 0.25, "optional");

export const myMidjourneyAPIKeySetting = new PublicInstanceSetting<string | null>('myMidjourney.apiKey', null, "optional");
export const maxAllowedApiSkip = new PublicInstanceSetting<number | null>("maxAllowedApiSkip", 2000, "optional")

export const recombeeDatabaseIdSetting = new PublicInstanceSetting<string | null>('recombee.databaseId', null, "optional");
export const recombeePublicApiTokenSetting = new PublicInstanceSetting<string | null>('recombee.publicApiToken', null, "optional");
export const recombeePrivateApiTokenSetting = new PublicInstanceSetting<string | null>('recombee.privateApiToken', null, "optional");

export const isDatadogEnabled = isEAForum;

export type PostFeedDetails = {
  name: string,
  label: string,
  description?: string,
  disabled?: boolean,
  adminOnly?: boolean,
  showLabsIcon?: boolean,
  isInfiniteScroll?: boolean,
  slug?: string,
  showToLoggedOut?: boolean,
}

export const homepagePostFeedsSetting = new PublicInstanceSetting<PostFeedDetails[]>('homepagePosts.feeds', [
    {
      'name': 'forum-classic',
      'label': 'Latest',
      'description': 'The classic LessWrong frontpage algorithm that combines karma with time discounting, plus any tag-based weighting if applied.',
    },
    {
      'name': 'forum-bookmarks',
      'label': 'Bookmarks',
      'description': 'A list of posts you saved because you wanted to have them findable later.',
    },
    {
      'name': 'forum-continue-reading',
      'label': 'Resume Reading',
      'description': 'Further posts in post sequences that you started reading.',
    },
  ]
  , 'optional')

/**
 * This is a filepath that is _relative_ to the location of the instance settings file itself.
 * See full explanation in `google-vertex/client.ts`
 */
export const googleRecommendationsCredsPath = new PublicInstanceSetting<string | null>('google.recommendationsServiceCredsPath', null, "optional");

export const recombeeCacheTtlMsSetting = new PublicInstanceSetting<number>('recombee.cacheTtlMs', 1000 * 60 * 60 * 24 * 30, "optional");

export const isBotSiteSetting = new PublicInstanceSetting<boolean>('botSite.isBotSite', false, 'optional');

export const aboutPostIdSetting = new PublicInstanceSetting<string>('aboutPostId', 'bJ2haLkcGeLtTWaD5', "warning") // Post ID for the /about route

export const anthropicApiKey = new PublicInstanceSetting<string>('anthropic.claudeTestKey', "LessWrong", "optional")

export const falApiKey = new PublicInstanceSetting<string>('falAI.apiKey', "", "optional")

export const jargonBotClaudeKey = new PublicInstanceSetting<string>('anthropic.jargonBotClaudeKey', "", "optional")

export const hyperbolicApiKey = new PublicInstanceSetting<string>('hyperbolic.apiKey', "", "optional")

export const twitterBotEnabledSetting = new PublicInstanceSetting<boolean>("twitterBot.enabled", false, "optional");
export const twitterBotKarmaThresholdSetting = new PublicInstanceSetting<number>("twitterBot.karmaThreshold", 40, "optional");

export const airtableApiKeySetting = new PublicInstanceSetting<string | null>('airtable.apiKey', null, "optional");
export const saplingApiKey = new PublicInstanceSetting<string>("sapling.apiKey", "", "optional");
export const forumHeaderTitleSetting = new PublicInstanceSetting<string>('forumSettings.headerTitle', "LESSWRONG", "warning");
export const forumShortTitleSetting = new PublicInstanceSetting<string>('forumSettings.shortForumTitle', "LW", "warning");

export const eaHomeSequenceFirstPostId = new PublicInstanceSetting<string | null>('eaHomeSequenceFirstPostId', null, "optional"); // Post ID for the first post in the EAHomeHandbook Sequence

export const allowTypeIIIPlayerSetting = new PublicInstanceSetting<boolean>('allowTypeIIIPlayer', false, "optional");

export const faqPostIdSetting = new PublicInstanceSetting<string>('faqPostId', '2rWKkWuPrgTMpLRbp', "warning"); // Post ID for the /faq route
export const contactPostIdSetting = new PublicInstanceSetting<string>('contactPostId', "ehcYkvyz7dh9L7Wt8", "warning");
export const introPostIdSetting = new PublicInstanceSetting<string | null>('introPostId', null, "optional");

export const instanceDebuggersSetting = new PublicInstanceSetting<string[]>('instanceDebuggers', [], 'optional');

/** Path of the certificate file *relative* to the instance settings file (so we don't have to store the full cert in instance settings) */
export const sslCAFileSetting = new PublicInstanceSetting<string | null>(
  "analytics.caFilePath",
  isEAForum ? "./certs/us-east-1-bundle.cer" : null,
  "optional"
);

// Since different environments are connected to the same DB, this setting cannot be moved to the database
export const environmentDescriptionSetting = new PublicInstanceSetting<string>("analytics.environment", "misconfigured", "warning");

export const botSiteRedirectEnabledSetting = new PublicInstanceSetting<boolean>('botSite.redirectEnabled', false, 'optional');

// For development, there's a matched set of CkEditor settings as instance
// settings, which take precedence over the database settings. This allows
// using custom CkEditor settings that don't match what's in the attached
// database.
export const ckEditorEnvironmentIdOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.environmentId', null, "optional");
export const ckEditorSecretKeyOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.secretKey', null, "optional");
export const ckEditorApiPrefixOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.apiPrefix', null, "optional");
export const ckEditorApiSecretKeyOverrideSetting = new PublicInstanceSetting<string | null>('ckEditorOverride.apiSecretKey', null, "optional");

// disallowCrawlers: If set, robots.txt will request that no crawlers touch the
// site at all. Use for test and staging servers like lessestwrong.com and
// baserates.org, so that only the real site will be indexed by search engines.
//
// If set, this takes precedence over the robotsTxt setting.
export const disallowCrawlersSetting = new PublicInstanceSetting<boolean>('disallowCrawlers', false, "optional");


export const elasticCloudIdSetting = new PublicInstanceSetting<string | null>(
  "elasticsearch.cloudId",
  null,
  "optional"
);

export const elasticUsernameSetting = new PublicInstanceSetting<string | null>(
  "elasticsearch.username",
  null,
  "optional"
);

export const elasticPasswordSetting = new PublicInstanceSetting<string | null>(
  "elasticsearch.password",
  null,
  "optional"
);

export const searchOriginDate = new PublicInstanceSetting<string>(
  "searchOriginDate",
  "2014-06-01T01:00:00Z",
  "optional"
);

export const pgConnIdleTimeoutMsSetting = new PublicInstanceSetting<number>('pg.idleTimeoutMs', 10000, 'optional');

// Database ID string that this config file should match with
export const expectedDatabaseIdSetting = new PublicInstanceSetting<string | null>('expectedDatabaseId', null, "warning");

export const apiKeySetting = new PublicInstanceSetting<string | null>("twitterBot.apiKey", null, "optional");
export const apiKeySecretSetting = new PublicInstanceSetting<string | null>("twitterBot.apiKeySecret", null, "optional");
export const accessTokenSetting = new PublicInstanceSetting<string | null>("twitterBot.accessToken", null, "optional");
export const accessTokenSecretSetting = new PublicInstanceSetting<string | null>("twitterBot.accessTokenSecret", null, "optional");
/*
  Public Database Settings
*/

export const googleTagManagerIdSetting = new PublicInstanceSetting<string | null>('googleTagManager.apiKey', null, "optional"); // Google Tag Manager ID
export const reCaptchaSiteKeySetting = new PublicInstanceSetting<string | null>('reCaptcha.apiKey', null, "optional"); // ReCaptcha API Key
// Despite the name, this setting is also used to set the index prefix for Elasticsearch for legacy reasons
export const algoliaPrefixSetting = new PublicInstanceSetting<string>('algolia.indexPrefix', '', "optional");

export const ckEditorUploadUrlSetting = new PublicInstanceSetting<string | null>('ckEditor.uploadUrl', null, "optional"); // Image Upload URL for CKEditor
export const ckEditorWebsocketUrlSetting = new PublicInstanceSetting<string | null>('ckEditor.webSocketUrl', null, "optional"); // Websocket URL for CKEditor (for collaboration)


export const hideUnreviewedAuthorCommentsSettings = new PublicInstanceSetting<string | null>('hideUnreviewedAuthorComments', null, "optional"); // Hide comments by unreviewed authors after date provided (prevents spam / flaming / makes moderation easier, but delays new user engagement)
export const cloudinaryCloudNameSetting = new PublicInstanceSetting<string>('cloudinary.cloudName', 'lesswrong-2-0', "optional"); // Cloud name for cloudinary hosting

export const forumAllPostsNumDaysSetting = new PublicInstanceSetting<number>('forum.numberOfDays', 10, "optional"); // Number of days to display in the timeframe view

export const nofollowKarmaThreshold = new PublicInstanceSetting<number>('nofollowKarmaThreshold', 10, "optional"); // Users with less than this much karma have their links marked as nofollow

export const localeSetting = new PublicInstanceSetting<string>('locale', 'en-US', "optional");
export const legacyRouteAcronymSetting = new PublicInstanceSetting<string>('legacyRouteAcronym', 'lw', "optional"); // Because the EA Forum was identical except for the change from /lw/ to /ea/
// frontpageFilterSettings default tag filter
//
// At the risk of premature future-proofing, this setting, which is initially
// here to allow the EA Forum to nudge down the visibility of posts with the
// Community tag, can be trivially applied to personalBlog, frontpage, and
// curated, if those ever get refactored into tags.
export const defaultVisibilityTags = new PublicInstanceSetting<Array<FilterTag>>('defaultVisibilityTags', [], "optional");

export const gatherTownRoomId = new PublicInstanceSetting<string | null>("gatherTownRoomId", "aPVfK3G76UukgiHx", "optional");
export const gatherTownRoomName = new PublicInstanceSetting<string | null>("gatherTownRoomName", "lesswrong-campus", "optional");

// Public elicit settings
export const elicitSourceURL = new PublicInstanceSetting('elicitSourceURL', 'https://LessWrong.com', "optional");
export const elicitSourceId = new PublicInstanceSetting('elicitSourceId', 'XCjOpumu-', "optional");

export const mapboxAPIKeySetting = new PublicInstanceSetting<string | null>('mapbox.apiKey', null, "optional"); // API Key for the mapbox map and tile requests

export const mailchimpForumDigestListIdSetting = new PublicInstanceSetting<string | null>('mailchimp.forumDigestListId', null, "optional");
export const mailchimpEAForumListIdSetting = new PublicInstanceSetting<string | null>('mailchimp.eaForumListId', null, "optional");
export const mailchimpEAForumNewsletterListIdSetting = new PublicInstanceSetting<string | null>('mailchimp.eaNewsletterListId', null, "optional");

export const isProductionDBSetting = new PublicInstanceSetting<boolean>('isProductionDB', false, "optional");

export const showReviewOnFrontPageIfActive = new PublicInstanceSetting<boolean>('annualReview.showReviewOnFrontPageIfActive', true, "optional");

// these are deprecated, but preserved for now in case we want to revert
// export const annualReviewStart = new PublicInstanceSetting('annualReview.start', "2021-11-30", "optional")
// // The following dates cut off their phase at the end of the day
// export const annualReviewNominationPhaseEnd = new PublicInstanceSetting('annualReview.nominationPhaseEnd', "2021-12-14", "optional")
// export const annualReviewReviewPhaseEnd = new PublicInstanceSetting('annualReview.reviewPhaseEnd', "2022-01-15", "optional")
// export const annualReviewVotingPhaseEnd = new PublicInstanceSetting('annualReview.votingPhaseEnd', "2022-02-01", "optional")
// export const annualReviewEnd = new PublicInstanceSetting('annualReview.end', "2022-02-06", "optional")

export const annualReviewAnnouncementPostPathSetting = new PublicInstanceSetting<string | null>('annualReview.announcementPostPath', null, "optional");

export const annualReviewVotingResultsPostPath = new PublicInstanceSetting<string>('annualReview.votingResultsPostPath', "", "optional");

export const reviewWinnersCoverArtIds = new PublicInstanceSetting<Record<string, string>>('annualReview.reviewWinnersCoverArtIds', {}, "optional");

export type CoordinateInfo = Omit<SplashArtCoordinates, '_id' | 'reviewWinnerArtId'> & {
  leftHeightPct?: number;
  middleHeightPct?: number;
  rightHeightPct?: number;
};

export interface ReviewSectionInfo {
  title?: string;
  imgUrl: string;
  order: number;
  coords: CoordinateInfo;
  tag: string | null;
}

export interface ReviewYearGroupInfo {
  title?: string;
  imgUrl: string;
  coords: CoordinateInfo;
}

export const reviewWinnerSectionsInfo = new PublicInstanceSetting<Record<ReviewWinnerCategory, ReviewSectionInfo> | null>('annualReview.reviewWinnerSectionsInfo', null, "optional");
export const reviewWinnerYearGroupsInfo = new PublicInstanceSetting<Record<ReviewYear, ReviewYearGroupInfo> | null>('annualReview.reviewWinnerYearGroupsInfo', null, "optional");


export const moderationEmail = new PublicInstanceSetting<string>('moderationEmail', "ERROR: NO MODERATION EMAIL SET", "optional");

type AccountInfo = {
  username: string;
  email: string;
};
export const adminAccountSetting = new PublicInstanceSetting<AccountInfo | null>('adminAccount', null, "optional");

export const crosspostKarmaThreshold = new PublicInstanceSetting<number | null>('crosspostKarmaThreshold', 100, "optional");

export const ddTracingSampleRate = new PublicInstanceSetting<number>('datadog.tracingSampleRate', 100, "optional"); // Sample rate for backend traces, between 0 and 100
export const ddRumSampleRate = new PublicInstanceSetting<number>('datadog.rumSampleRate', 100, "optional"); // Sample rate for backend traces, between 0 and 100
export const ddSessionReplaySampleRate = new PublicInstanceSetting<number>('datadog.sessionReplaySampleRate', 100, "optional"); // Sample rate for backend traces, between 0 and 100

/** Will we show our logo prominently, such as in the header */
export const hasProminentLogoSetting = new PublicInstanceSetting<boolean>("hasProminentLogo", false, "optional");

export const hasCookieConsentSetting = new PublicInstanceSetting<boolean>('hasCookieConsent', false, "optional");

export const maxRenderQueueSize = new PublicInstanceSetting<number>('maxRenderQueueSize', 10, "optional");
export const queuedRequestTimeoutSecondsSetting = new PublicInstanceSetting<number>('queuedRequestTimeoutSeconds', 60, "optional");

export type Auth0ClientSettings = {
  domain: string;
  clientId: string;
  connection: string;
};
export const auth0ClientSettings = new PublicInstanceSetting<Auth0ClientSettings | null>("auth0", null, "optional");

// Null means requests are disabled
export const requestFeedbackKarmaLevelSetting = new PublicInstanceSetting<number | null>('post.requestFeedbackKarmaLevel', 100, "optional");

export const alwaysShowAnonymousReactsSetting = new PublicInstanceSetting<boolean>('voting.eaEmoji.alwaysShowAnonymousReacts', true, "optional");

export const showSubscribeReminderInFeed = new PublicInstanceSetting<boolean>('feed.showSubscribeReminder', true, "optional");

export const hasGoogleDocImportSetting = new PublicInstanceSetting<boolean>('googleDocImport.enabled', false, "optional");


export const recombeeEnabledSetting = new PublicInstanceSetting<boolean>('recombee.enabled', false, "optional");
export const recommendationsTabManuallyStickiedPostIdsSetting = new PublicInstanceSetting<string[]>('recommendationsTab.manuallyStickiedPostIds', [], "optional");

export const blackBarTitle = new PublicInstanceSetting<string | null>('blackBarTitle', null, "optional");

export const quickTakesTagsEnabledSetting = new PublicInstanceSetting<boolean>('quickTakes.tagsEnabled', isEAForum, "optional");

export const vertexEnabledSetting = new PublicInstanceSetting<boolean>('googleVertex.enabled', false, "optional");

/** Whether to show permalinked (?commentId=...) comments at the top of the page, vs scrolling to show them in context */
export const commentPermalinkStyleSetting = new PublicInstanceSetting<'top' | 'in-context'>('commentPermalinkStyle', isEAForum ? 'in-context' : 'top', "optional");

export const userIdsWithAccessToLlmChat = new PublicInstanceSetting<string[]>('llmChat.userIds', [], "optional");

export const textReplacementsSetting = new PublicInstanceSetting<Record<string, string>>('textReplacements', {}, "optional");

export const lightconeFundraiserUnsyncedAmount = new PublicInstanceSetting<number>('lightconeFundraiser.unsyncedAmount', 0, "optional");
export const lightconeFundraiserPaymentLinkId = new PublicInstanceSetting<string>('lightconeFundraiser.paymentLinkId', '', "optional");
export const lightconeFundraiserThermometerBgUrl = new PublicInstanceSetting<string>('lightconeFundraiser.thermometerBgUrl', '', "optional");
export const lightconeFundraiserThermometerGoalAmount = new PublicInstanceSetting<number>('lightconeFundraiser.thermometerGoalAmount', 0, "optional");
export const lightconeFundraiserThermometerGoal2Amount = new PublicInstanceSetting<number>('lightconeFundraiser.thermometerGoal2Amount', 2000000, "optional");
export const lightconeFundraiserThermometerGoal3Amount = new PublicInstanceSetting<number>('lightconeFundraiser.thermometerGoal3Amount', 3000000, "optional");
export const lightconeFundraiserPostId = new PublicInstanceSetting<string>('lightconeFundraiser.postId', '', "optional");
export const lightconeFundraiserActive = new PublicInstanceSetting<boolean>('lightconeFundraiser.active', false, "optional");

export const postsListViewTypeSetting = new PublicInstanceSetting<string>('posts.viewType', 'list', "optional");
export const quickTakesMaxAgeDaysSetting = new PublicInstanceSetting<number>('feed.quickTakesMaxAgeDays', 5, "optional");

export const auth0FacebookLoginEnabled = new PublicInstanceSetting<boolean>('auth0FacebookLoginEnabled', false, "optional");

export const mapsAPIKeySetting = new PublicInstanceSetting<string | null>('googleMaps.apiKey', null, "optional");

export const siteImageSetting = new PublicInstanceSetting<string>('siteImage', 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1654295382/new_mississippi_river_fjdmww.jpg', "optional"); // An image used to represent the site on social media

export const ultraFeedEnabledSetting = new PublicInstanceSetting<boolean>('ultraFeedEnabled', false, "optional");

export const petrovBeforeTime = new PublicInstanceSetting<number>('petrov.beforeTime', 0, "optional");
export const petrovAfterTime = new PublicInstanceSetting<number>('petrov.afterTime', 0, "optional");

export const openThreadTagIdSetting = new PublicInstanceSetting<string>('openThreadTagId', 'eTLv8KzwBGcDip9Wi', "optional");
export const startHerePostIdSetting = new PublicInstanceSetting<string | null>('startHerePostId', null, "optional");
export const amaTagIdSetting = new PublicInstanceSetting<string | null>('amaTagId', null, "optional");

export const defaultSequenceBannerIdSetting = new PublicInstanceSetting<string | null>("defaultSequenceBannerId", null, "optional");

export const graphqlBatchMaxSetting = new PublicInstanceSetting('batchHttpLink.batchMax', 50, "optional");

export const firstCommentAcknowledgeMessageCommentIdSetting = new PublicInstanceSetting<string>('firstCommentAcknowledgeMessageCommentId', '', "optional");

export const ipApiKeySetting = new PublicInstanceSetting<string | null>('ipapi.apiKey', null, "optional");

export const intercomAppIdSetting = new PublicInstanceSetting<string>('intercomAppId', 'wtb8z7sj', "optional");

export const maintenanceTime = new PublicInstanceSetting<string | null>("maintenanceBannerTime", null, "optional");
export const explanationText = new PublicInstanceSetting<string>("maintenanceBannerExplanationText", "", "optional");
export const showSmallpoxSetting = new PublicInstanceSetting<boolean>('showSmallpox', false, "optional");
export const showEventBannerSetting = new PublicInstanceSetting<boolean>('showEventBanner', false, "optional");
export const showMaintenanceBannerSetting = new PublicInstanceSetting<boolean>('showMaintenanceBanner', false, "optional");
export const eventBannerMobileImageSetting = new PublicInstanceSetting<string | null>('eventBannerMobileImage', null, "optional");
export const eventBannerDesktopImageSetting = new PublicInstanceSetting<string | null>('eventBannerDesktopImage', null, "optional");
export const eventBannerLinkSetting = new PublicInstanceSetting<string | null>('eventBannerLink', null, "optional");

export const buttonBurstSetting = new PublicInstanceSetting<boolean>("buttonBurst.enabled", false, "optional");
export const buttonBurstImage = new PublicInstanceSetting<string>("buttonBurst.image", "https://res.cloudinary.com/cea/image/upload/w_256,h_256,q_40,f_auto,dpr_1/v1711484824/bulby-canonical.png", "optional");

export const placeholderSetting = new PublicInstanceSetting<string>("linkpostUrlPlaceholder", "http://example.com/blog/2017/reality-has-a-surprising-amount-of-detail", "optional");

export const disableCookiePreferenceAutoUpdateSetting = new PublicInstanceSetting<boolean>('disableCookiePreferenceAutoUpdate', false, "optional");

export const cloudinaryUploadPresetGridImageSetting = new PublicInstanceSetting<string>("cloudinary.uploadPresetGridImage", "tz0mgw2s", "optional");
export const cloudinaryUploadPresetBannerSetting = new PublicInstanceSetting<string>("cloudinary.uploadPresetBanner", "navcjwf7", "optional");
export const cloudinaryUploadPresetProfileSetting = new PublicInstanceSetting<string | null>("cloudinary.uploadPresetProfile", null, "optional");
export const cloudinaryUploadPresetSocialPreviewSetting = new PublicInstanceSetting<string | null>("cloudinary.uploadPresetSocialPreview", null, "optional");
export const cloudinaryUploadPresetEventImageSetting = new PublicInstanceSetting<string | null>("cloudinary.uploadPresetEventImage", null, "optional");
export const cloudinaryUploadPresetSpotlightSetting = new PublicInstanceSetting<string | null>("cloudinary.uploadPresetSpotlight", "yjgxmsio", "optional");
export const cloudinaryUploadPresetDigestSetting = new PublicInstanceSetting<string | null>("cloudinary.uploadPresetDigest", null, "optional");

// Number of weeks to display in the timeframe view
export const forumAllPostsNumWeeksSetting = new PublicInstanceSetting<number>("forum.numberOfWeeks", 4, "optional");
// Number of months to display in the timeframe view
export const forumAllPostsNumMonthsSetting = new PublicInstanceSetting<number>("forum.numberOfMonths", 4, "optional");
// Number of years to display in the timeframe view
export const forumAllPostsNumYearsSetting = new PublicInstanceSetting<number>("forum.numberOfYears", 4, "optional");

export const bookDisplaySetting = new PublicInstanceSetting<boolean>('bookDisplaySetting', false, "optional");

export const enableGoodHeartProject = new PublicInstanceSetting<boolean>('enableGoodHeartProject', false, "optional"); // enables UI for 2022 LW April Fools

export const petrovPostIdSetting = new PublicInstanceSetting<string>('petrov.petrovPostId', '', "optional");
export const petrovGamePostIdSetting = new PublicInstanceSetting<string>('petrov.petrovGamePostId', '', "optional");

export const defaultAFModeratorPMsTagSlug = new PublicInstanceSetting<string>('defaultAFModeratorPMsTagSlug', "af-default-moderator-responses", "optional");
export const commentModerationWarningCommentIdSetting = new PublicInstanceSetting<string>('commentModerationWarningCommentId', '', "optional");
export const postModerationWarningCommentIdSetting = new PublicInstanceSetting<string>('postModerationWarningCommentId', '', "optional");

export const useExperimentalTagStyleSetting = new PublicInstanceSetting<boolean>('useExperimentalTagStyle', false, "optional");

export const showAnalyticsDebug = new PublicInstanceSetting<"never" | "dev" | "always">("showAnalyticsDebug", "dev", "optional");
export const flushIntervalSetting = new PublicInstanceSetting<number>("analyticsFlushInterval", 1000, "optional");

type ReasonNoReviewNeeded = "alreadyApproved" | "noReview";
type ReasonReviewIsNeeded = "mapLocation" | "firstPost" | "firstComment" | "contactedTooManyUsers" | "bio" | "profileImage" | "newContent";
export type ReasonForInitialReview = Exclude<ReasonReviewIsNeeded, 'newContent'>;
export type GetReasonForReviewResult =
  { needsReview: false; reason: ReasonNoReviewNeeded; } |
  { needsReview: true; reason: ReasonReviewIsNeeded; };


export const reviewReasonsSetting = new PublicInstanceSetting<Array<ReasonForInitialReview>>('moderation.reasonsForInitialReview', ['firstPost', 'firstComment', 'contactedTooManyUsers', 'bio', 'profileImage'], "optional");

export const type3DateCutoffSetting = new PublicInstanceSetting<string>('type3.cutoffDate', '2023-05-01', "optional");
export const type3ExplicitlyAllowedPostIdsSetting = new PublicInstanceSetting<string[]>('type3.explicitlyAllowedPostIds', [], "optional");
/** type3KarmaCutoffSetting is here to allow including high karma posts from before type3DateCutoffSetting */
export const type3KarmaCutoffSetting = new PublicInstanceSetting<number>('type3.karmaCutoff', Infinity, "optional");
export const newUserIconKarmaThresholdSetting = new PublicInstanceSetting<number | null>('newUserIconKarmaThreshold', null, "optional");
export const cloudinaryUploadPresetEditorName = new PublicInstanceSetting<string | null>('cloudinary.uploadPresetEditor', null, "optional");

// LW (and legacy) time decay algorithm settings
export const timeDecayFactorSetting = new PublicInstanceSetting<number>('timeDecayFactor', 1.15, "optional");
export const frontpageBonusSetting = new PublicInstanceSetting<number>('frontpageScoreBonus', 10, "optional");
export const curatedBonusSetting = new PublicInstanceSetting<number>('curatedScoreBonus', 10, "optional");

/**
 * We apply a score boost to subforum comments using the formula:
 *   max(b, m * (1 - ((x / d) ** p)))
 * where b is the base (the minimum boost received after the duration
 * has expired), m is the magnitude (the maximum boost when the comment
 * is first posted), d is the duration in hours, p is the exponent
 * (defining the dropoff curve), and x is the elapsed time since the
 * comment was posted in hours.
 */
export const defaultSubforumCommentBonus = {
  base: 5,
  magnitude: 100,
  duration: 8,
  exponent: 0.3,
} as const;

export type SubforumCommentBonus = typeof defaultSubforumCommentBonus;

export const subforumCommentBonusSetting = new PublicInstanceSetting<SubforumCommentBonus>('subforumCommentBonus', defaultSubforumCommentBonus, "optional");

// EA Frontpage time decay algorithm settings
export const startingAgeHoursSetting = new PublicInstanceSetting<number>('frontpageAlgorithm.startingAgeHours', 6, "optional");
export const decayFactorSlowestSetting = new PublicInstanceSetting<number>('frontpageAlgorithm.decayFactorSlowest', 0.5, "optional");
export const decayFactorFastestSetting = new PublicInstanceSetting<number>('frontpageAlgorithm.decayFactorFastest', 1.08, "optional");
export const activityWeightSetting = new PublicInstanceSetting<number>('frontpageAlgorithm.activityWeight', 1.4, "optional");
export const activityHalfLifeSetting = new PublicInstanceSetting<number>('frontpageAlgorithm.activityHalfLife', 60, "optional");
export const frontpageDaysAgoCutoffSetting = new PublicInstanceSetting<number>('frontpageAlgorithm.daysAgoCutoff', 90, "optional");
export const databaseDebuggersSetting = new PublicInstanceSetting<string[]>('debuggers', [], "optional");

// 'Maximum documents per request'
export const maxDocumentsPerRequestSetting = new PublicInstanceSetting<number>('maxDocumentsPerRequest', 5000, "optional");

export const addNewReactKarmaThreshold = new PublicInstanceSetting("reacts.addNewReactKarmaThreshold", 100, "optional");
export const addNameToExistingReactKarmaThreshold = new PublicInstanceSetting("reacts.addNameToExistingReactKarmaThreshold", 20, "optional");
export const downvoteExistingReactKarmaThreshold = new PublicInstanceSetting("reacts.downvoteExistingReactKarmaThreshold", 20, "optional");

export const karmaRewarderId100 = new PublicInstanceSetting<string | null>('karmaRewarderId100', null, "optional");
export const karmaRewarderId1000 = new PublicInstanceSetting<string | null>('karmaRewarderId1000', null, "optional");

export const logoUrlSetting = new PublicInstanceSetting<string | null>('logoUrl', null, "optional");

/** Url of the bot site to redirect to, e.g. https://forum-bots.effectivealtruism.org (must include the http(s)://) */
export const botSiteUrlSetting = new PublicInstanceSetting<string | null>('botSite.url', null, "optional");
/** e.g.
 * {
 *   '.*': [ // matches all paths
 *     '.*python.*',
 *     ...
 *   ],
 *   '/allPosts/?.*|/graphql/?.*': [ // Matches any path starting with /allPosts/ or /graphql/
 *     '.*python.*',
 *     ...
 *   ],
 * }
*/
export const botSiteUserAgentRegexesSetting = new PublicInstanceSetting<Record<string, string[]> | null>('botSite.userAgentRegexes', null, "optional");
