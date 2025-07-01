import { isServer, isDevelopment, isAnyTest, isE2E } from './executionEnvironment';
import { pluralize } from './vulcan-lib/pluralize';
import startCase from 'lodash/startCase' // AKA: capitalize, titleCase
import { TupleSet, UnionOf } from './utils/typeGuardUtils';
import {initializeSetting} from './settingsCache'
import { getInstanceSettings } from './getInstanceSettings';
import { getCommandLineArguments } from '@/server/commandLine';
import type { FilterTag } from './filterSettings';
import { forumSelect } from './forumTypeUtils';
import { DatabasePublicSetting } from './publicSettings';
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

export const googleTagManagerIdSetting = new DatabasePublicSetting<string | null>('googleTagManager.apiKey', null); // Google Tag Manager ID
export const reCaptchaSiteKeySetting = new DatabasePublicSetting<string | null>('reCaptcha.apiKey', null); // ReCaptcha API Key
// Despite the name, this setting is also used to set the index prefix for Elasticsearch for legacy reasons
export const algoliaPrefixSetting = new DatabasePublicSetting<string>('algolia.indexPrefix', '');

export const ckEditorUploadUrlSetting = new DatabasePublicSetting<string | null>('ckEditor.uploadUrl', null); // Image Upload URL for CKEditor
export const ckEditorWebsocketUrlSetting = new DatabasePublicSetting<string | null>('ckEditor.webSocketUrl', null); // Websocket URL for CKEditor (for collaboration)


export const hideUnreviewedAuthorCommentsSettings = new DatabasePublicSetting<string | null>('hideUnreviewedAuthorComments', null); // Hide comments by unreviewed authors after date provided (prevents spam / flaming / makes moderation easier, but delays new user engagement)
export const cloudinaryCloudNameSetting = new DatabasePublicSetting<string>('cloudinary.cloudName', 'lesswrong-2-0'); // Cloud name for cloudinary hosting

export const forumAllPostsNumDaysSetting = new DatabasePublicSetting<number>('forum.numberOfDays', 10); // Number of days to display in the timeframe view

export const nofollowKarmaThreshold = new DatabasePublicSetting<number>('nofollowKarmaThreshold', 10); // Users with less than this much karma have their links marked as nofollow

export const localeSetting = new DatabasePublicSetting<string>('locale', 'en-US');
export const legacyRouteAcronymSetting = new DatabasePublicSetting<string>('legacyRouteAcronym', 'lw'); // Because the EA Forum was identical except for the change from /lw/ to /ea/
// frontpageFilterSettings default tag filter
//
// At the risk of premature future-proofing, this setting, which is initially
// here to allow the EA Forum to nudge down the visibility of posts with the
// Community tag, can be trivially applied to personalBlog, frontpage, and
// curated, if those ever get refactored into tags.
export const defaultVisibilityTags = new DatabasePublicSetting<Array<FilterTag>>('defaultVisibilityTags', []);

export const gatherTownRoomId = new DatabasePublicSetting<string | null>("gatherTownRoomId", "aPVfK3G76UukgiHx");
export const gatherTownRoomName = new DatabasePublicSetting<string | null>("gatherTownRoomName", "lesswrong-campus");
// Public elicit settings

export const elicitSourceURL = new DatabasePublicSetting('elicitSourceURL', 'https://LessWrong.com');
export const elicitSourceId = new DatabasePublicSetting('elicitSourceId', 'XCjOpumu-');

export const mapboxAPIKeySetting = new DatabasePublicSetting<string | null>('mapbox.apiKey', null); // API Key for the mapbox map and tile requests

export const mailchimpForumDigestListIdSetting = new DatabasePublicSetting<string | null>('mailchimp.forumDigestListId', null);
export const mailchimpEAForumListIdSetting = new DatabasePublicSetting<string | null>('mailchimp.eaForumListId', null);
export const mailchimpEAForumNewsletterListIdSetting = new DatabasePublicSetting<string | null>('mailchimp.eaNewsletterListId', null);

export const isProductionDBSetting = new DatabasePublicSetting<boolean>('isProductionDB', false);

export const showReviewOnFrontPageIfActive = new DatabasePublicSetting<boolean>('annualReview.showReviewOnFrontPageIfActive', true);
// these are deprecated, but preserved for now in case we want to revert
// export const annualReviewStart = new DatabasePublicSetting('annualReview.start', "2021-11-30")
// // The following dates cut off their phase at the end of the day
// export const annualReviewNominationPhaseEnd = new DatabasePublicSetting('annualReview.nominationPhaseEnd', "2021-12-14")
// export const annualReviewReviewPhaseEnd = new DatabasePublicSetting('annualReview.reviewPhaseEnd', "2022-01-15")
// export const annualReviewVotingPhaseEnd = new DatabasePublicSetting('annualReview.votingPhaseEnd', "2022-02-01")
// export const annualReviewEnd = new DatabasePublicSetting('annualReview.end', "2022-02-06")

export const annualReviewAnnouncementPostPathSetting = new DatabasePublicSetting<string | null>('annualReview.announcementPostPath', null);

export const annualReviewVotingResultsPostPath = new DatabasePublicSetting<string>('annualReview.votingResultsPostPath', "");

export const reviewWinnersCoverArtIds = new DatabasePublicSetting<Record<string, string>>('annualReview.reviewWinnersCoverArtIds', {});

export const reviewWinnerSectionsInfo = new DatabasePublicSetting<Record<ReviewWinnerCategory, ReviewSectionInfo> | null>('annualReview.reviewWinnerSectionsInfo', null);
export const reviewWinnerYearGroupsInfo = new DatabasePublicSetting<Record<ReviewYear, ReviewYearGroupInfo> | null>('annualReview.reviewWinnerYearGroupsInfo', null);

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


export const moderationEmail = new DatabasePublicSetting<string>('moderationEmail', "ERROR: NO MODERATION EMAIL SET");
type AccountInfo = {
  username: string;
  email: string;
};
export const adminAccountSetting = new DatabasePublicSetting<AccountInfo | null>('adminAccount', null);

export const crosspostKarmaThreshold = new DatabasePublicSetting<number | null>('crosspostKarmaThreshold', 100);

export const ddTracingSampleRate = new DatabasePublicSetting<number>('datadog.tracingSampleRate', 100); // Sample rate for backend traces, between 0 and 100
export const ddRumSampleRate = new DatabasePublicSetting<number>('datadog.rumSampleRate', 100); // Sample rate for backend traces, between 0 and 100
export const ddSessionReplaySampleRate = new DatabasePublicSetting<number>('datadog.sessionReplaySampleRate', 100); // Sample rate for backend traces, between 0 and 100
/** Will we show our logo prominently, such as in the header */
export const hasProminentLogoSetting = new DatabasePublicSetting<boolean>("hasProminentLogo", false);

export const hasCookieConsentSetting = new DatabasePublicSetting<boolean>('hasCookieConsent', false);

export const maxRenderQueueSize = new DatabasePublicSetting<number>('maxRenderQueueSize', 10);
export const queuedRequestTimeoutSecondsSetting = new DatabasePublicSetting<number>('queuedRequestTimeoutSeconds', 60);

export type Auth0ClientSettings = {
  domain: string;
  clientId: string;
  connection: string;
};
export const auth0ClientSettings = new DatabasePublicSetting<Auth0ClientSettings | null>("auth0", null);

// Null means requests are disabled
export const requestFeedbackKarmaLevelSetting = new DatabasePublicSetting<number | null>('post.requestFeedbackKarmaLevel', 100);

export const alwaysShowAnonymousReactsSetting = new DatabasePublicSetting<boolean>('voting.eaEmoji.alwaysShowAnonymousReacts', true);

export const showSubscribeReminderInFeed = new DatabasePublicSetting<boolean>('feed.showSubscribeReminder', forumSelect({ EAForum: true, LWAF: true, default: false }));

export const hasGoogleDocImportSetting = new DatabasePublicSetting<boolean>('googleDocImport.enabled', false);


export const recombeeEnabledSetting = new DatabasePublicSetting<boolean>('recombee.enabled', false);
export const recommendationsTabManuallyStickiedPostIdsSetting = new DatabasePublicSetting<string[]>('recommendationsTab.manuallyStickiedPostIds', []);

export const blackBarTitle = new DatabasePublicSetting<string | null>('blackBarTitle', null);

export const quickTakesTagsEnabledSetting = new DatabasePublicSetting<boolean>('quickTakes.tagsEnabled', isEAForum);

export const vertexEnabledSetting = new DatabasePublicSetting<boolean>('googleVertex.enabled', false);
/** Whether to show permalinked (?commentId=...) comments at the top of the page, vs scrolling to show them in context */

export const commentPermalinkStyleSetting = new DatabasePublicSetting<'top' | 'in-context'>('commentPermalinkStyle', isEAForum ? 'in-context' : 'top');

export const userIdsWithAccessToLlmChat = new DatabasePublicSetting<string[]>('llmChat.userIds', []);

export const textReplacementsSetting = new DatabasePublicSetting<Record<string, string>>('textReplacements', {});

export const lightconeFundraiserUnsyncedAmount = new DatabasePublicSetting<number>('lightconeFundraiser.unsyncedAmount', 0);
export const lightconeFundraiserPaymentLinkId = new DatabasePublicSetting<string>('lightconeFundraiser.paymentLinkId', '');
export const lightconeFundraiserThermometerBgUrl = new DatabasePublicSetting<string>('lightconeFundraiser.thermometerBgUrl', '');
export const lightconeFundraiserThermometerGoalAmount = new DatabasePublicSetting<number>('lightconeFundraiser.thermometerGoalAmount', 0);
export const lightconeFundraiserThermometerGoal2Amount = new DatabasePublicSetting<number>('lightconeFundraiser.thermometerGoal2Amount', 2000000);
export const lightconeFundraiserThermometerGoal3Amount = new DatabasePublicSetting<number>('lightconeFundraiser.thermometerGoal3Amount', 3000000);
export const lightconeFundraiserPostId = new DatabasePublicSetting<string>('lightconeFundraiser.postId', '');
export const lightconeFundraiserActive = new DatabasePublicSetting<boolean>('lightconeFundraiser.active', false);

export const postsListViewTypeSetting = new DatabasePublicSetting<string>('posts.viewType', 'list');
export const quickTakesMaxAgeDaysSetting = new DatabasePublicSetting<number>('feed.quickTakesMaxAgeDays', 5);

export const auth0FacebookLoginEnabled = new DatabasePublicSetting<boolean>('auth0FacebookLoginEnabled', new Date() < new Date('2025-04-07'));

export const mapsAPIKeySetting = new DatabasePublicSetting<string | null>('googleMaps.apiKey', null);

export const siteImageSetting = new DatabasePublicSetting<string>('siteImage', 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1654295382/new_mississippi_river_fjdmww.jpg'); // An image used to represent the site on social media

export const petrovBeforeTime = new DatabasePublicSetting<number>('petrov.beforeTime', 0);
export const petrovAfterTime = new DatabasePublicSetting<number>('petrov.afterTime', 0);

export const openThreadTagIdSetting = new DatabasePublicSetting<string>('openThreadTagId', 'eTLv8KzwBGcDip9Wi');
export const startHerePostIdSetting = new DatabasePublicSetting<string | null>('startHerePostId', null);
export const amaTagIdSetting = new DatabasePublicSetting<string | null>('amaTagId', null);

export const defaultSequenceBannerIdSetting = new DatabasePublicSetting<string | null>("defaultSequenceBannerId", null);

export const graphqlBatchMaxSetting = new DatabasePublicSetting('batchHttpLink.batchMax', 50);

export const firstCommentAcknowledgeMessageCommentIdSetting = new DatabasePublicSetting<string>('firstCommentAcknowledgeMessageCommentId', '');

export const ipApiKeySetting = new DatabasePublicSetting<string | null>('ipapi.apiKey', null);

export const intercomAppIdSetting = new DatabasePublicSetting<string>('intercomAppId', 'wtb8z7sj');

export const maintenanceTime = new DatabasePublicSetting<string | null>("maintenanceBannerTime", null);
export const explanationText = new DatabasePublicSetting<string>("maintenanceBannerExplanationText", "");
export const showSmallpoxSetting = new DatabasePublicSetting<boolean>('showSmallpox', false);
export const showEventBannerSetting = new DatabasePublicSetting<boolean>('showEventBanner', false);
export const showMaintenanceBannerSetting = new DatabasePublicSetting<boolean>('showMaintenanceBanner', false);
export const eventBannerMobileImageSetting = new DatabasePublicSetting<string | null>('eventBannerMobileImage', null);
export const eventBannerDesktopImageSetting = new DatabasePublicSetting<string | null>('eventBannerDesktopImage', null);
export const eventBannerLinkSetting = new DatabasePublicSetting<string | null>('eventBannerLink', null);

export const buttonBurstSetting = new DatabasePublicSetting<boolean>("buttonBurst.enabled", false);
export const buttonBurstImage = new DatabasePublicSetting<string>("buttonBurst.image", "https://res.cloudinary.com/cea/image/upload/w_256,h_256,q_40,f_auto,dpr_1/v1711484824/bulby-canonical.png");

export const placeholderSetting = new DatabasePublicSetting<string>("linkpostUrlPlaceholder", "http://example.com/blog/2017/reality-has-a-surprising-amount-of-detail");

export const disableCookiePreferenceAutoUpdateSetting = new DatabasePublicSetting<boolean>('disableCookiePreferenceAutoUpdate', false);

export const cloudinaryUploadPresetGridImageSetting = new DatabasePublicSetting<string>("cloudinary.uploadPresetGridImage", "tz0mgw2s");
export const cloudinaryUploadPresetBannerSetting = new DatabasePublicSetting<string>("cloudinary.uploadPresetBanner", "navcjwf7");
export const cloudinaryUploadPresetProfileSetting = new DatabasePublicSetting<string | null>("cloudinary.uploadPresetProfile", null);
export const cloudinaryUploadPresetSocialPreviewSetting = new DatabasePublicSetting<string | null>("cloudinary.uploadPresetSocialPreview", null);
export const cloudinaryUploadPresetEventImageSetting = new DatabasePublicSetting<string | null>("cloudinary.uploadPresetEventImage", null);
export const cloudinaryUploadPresetSpotlightSetting = new DatabasePublicSetting<string | null>("cloudinary.uploadPresetSpotlight", "yjgxmsio");
export const cloudinaryUploadPresetDigestSetting = new DatabasePublicSetting<string | null>("cloudinary.uploadPresetDigest", null);

// Number of weeks to display in the timeframe view
export const forumAllPostsNumWeeksSetting = new DatabasePublicSetting<number>("forum.numberOfWeeks", 4);
// Number of months to display in the timeframe view
export const forumAllPostsNumMonthsSetting = new DatabasePublicSetting<number>("forum.numberOfMonths", 4);
// Number of years to display in the timeframe view
export const forumAllPostsNumYearsSetting = new DatabasePublicSetting<number>("forum.numberOfYears", 4);

export const bookDisplaySetting = new DatabasePublicSetting<boolean>('bookDisplaySetting', false);

export const enableGoodHeartProject = new DatabasePublicSetting<boolean>('enableGoodHeartProject', false); // enables UI for 2022 LW April Fools

export const petrovPostIdSetting = new DatabasePublicSetting<string>('petrov.petrovPostId', '');
export const petrovGamePostIdSetting = new DatabasePublicSetting<string>('petrov.petrovGamePostId', '');

export const defaultAFModeratorPMsTagSlug = new DatabasePublicSetting<string>('defaultAFModeratorPMsTagSlug', "af-default-moderator-responses");
export const commentModerationWarningCommentIdSetting = new DatabasePublicSetting<string>('commentModerationWarningCommentId', '');
export const postModerationWarningCommentIdSetting = new DatabasePublicSetting<string>('postModerationWarningCommentId', '');

export const useExperimentalTagStyleSetting = new DatabasePublicSetting<boolean>('useExperimentalTagStyle', false);

export const showAnalyticsDebug = new DatabasePublicSetting<"never" | "dev" | "always">("showAnalyticsDebug", "dev");
export const flushIntervalSetting = new DatabasePublicSetting<number>("analyticsFlushInterval", 1000);
type ReasonNoReviewNeeded = "alreadyApproved" | "noReview";
type ReasonReviewIsNeeded = "mapLocation" | "firstPost" | "firstComment" | "contactedTooManyUsers" | "bio" | "profileImage" | "newContent";
export type ReasonForInitialReview = Exclude<ReasonReviewIsNeeded, 'newContent'>;
export type GetReasonForReviewResult =
  { needsReview: false; reason: ReasonNoReviewNeeded; } |
  { needsReview: true; reason: ReasonReviewIsNeeded; };


export const reviewReasonsSetting = new DatabasePublicSetting<Array<ReasonForInitialReview>>('moderation.reasonsForInitialReview', ['firstPost', 'firstComment', 'contactedTooManyUsers', 'bio', 'profileImage']);

export const type3DateCutoffSetting = new DatabasePublicSetting<string>('type3.cutoffDate', '2023-05-01');
export const type3ExplicitlyAllowedPostIdsSetting = new DatabasePublicSetting<string[]>('type3.explicitlyAllowedPostIds', []);
/** type3KarmaCutoffSetting is here to allow including high karma posts from before type3DateCutoffSetting */
export const type3KarmaCutoffSetting = new DatabasePublicSetting<number>('type3.karmaCutoff', Infinity);
export const newUserIconKarmaThresholdSetting = new DatabasePublicSetting<number | null>('newUserIconKarmaThreshold', null);
export const cloudinaryUploadPresetEditorName = new DatabasePublicSetting<string | null>('cloudinary.uploadPresetEditor', null);
// LW (and legacy) time decay algorithm settings
export const timeDecayFactorSetting = new DatabasePublicSetting<number>('timeDecayFactor', 1.15);
export const frontpageBonusSetting = new DatabasePublicSetting<number>('frontpageScoreBonus', 10);
export const curatedBonusSetting = new DatabasePublicSetting<number>('curatedScoreBonus', 10);
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

export const subforumCommentBonusSetting = new DatabasePublicSetting<SubforumCommentBonus>(
  'subforumCommentBonus',
  defaultSubforumCommentBonus
);
// EA Frontpage time decay algorithm settings

export const startingAgeHoursSetting = new DatabasePublicSetting<number>('frontpageAlgorithm.startingAgeHours', 6);
export const decayFactorSlowestSetting = new DatabasePublicSetting<number>('frontpageAlgorithm.decayFactorSlowest', 0.5);
export const decayFactorFastestSetting = new DatabasePublicSetting<number>('frontpageAlgorithm.decayFactorFastest', 1.08);
export const activityWeightSetting = new DatabasePublicSetting<number>('frontpageAlgorithm.activityWeight', 1.4);
export const activityHalfLifeSetting = new DatabasePublicSetting<number>('frontpageAlgorithm.activityHalfLife', 60);
export const frontpageDaysAgoCutoffSetting = new DatabasePublicSetting<number>('frontpageAlgorithm.daysAgoCutoff', 90);
export const databaseDebuggersSetting = new DatabasePublicSetting<string[]>('debuggers', []);
// 'Maximum documents per request'

export const maxDocumentsPerRequestSetting = new DatabasePublicSetting<number>('maxDocumentsPerRequest', 5000);

export const addNewReactKarmaThreshold = new DatabasePublicSetting("reacts.addNewReactKarmaThreshold", 100);
export const addNameToExistingReactKarmaThreshold = new DatabasePublicSetting("reacts.addNameToExistingReactKarmaThreshold", 20);
export const downvoteExistingReactKarmaThreshold = new DatabasePublicSetting("reacts.downvoteExistingReactKarmaThreshold", 20);

export const karmaRewarderId100 = new DatabasePublicSetting<string | null>('karmaRewarderId100', null);
export const karmaRewarderId1000 = new DatabasePublicSetting<string | null>('karmaRewarderId1000', null);

export const logoUrlSetting = new DatabasePublicSetting<string | null>('logoUrl', null);
/** Url of the bot site to redirect to, e.g. https://forum-bots.effectivealtruism.org (must include the http(s)://) */

export const botSiteUrlSetting = new DatabasePublicSetting<string | null>('botSite.url', null);
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
export const botSiteUserAgentRegexesSetting = new DatabasePublicSetting<Record<string, string[]> | null>('botSite.userAgentRegexes', null);

