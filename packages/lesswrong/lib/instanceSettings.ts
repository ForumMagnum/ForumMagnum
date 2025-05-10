import { isServer, isDevelopment, isAnyTest, isE2E } from './executionEnvironment';
import { pluralize } from './vulcan-lib/pluralize';
import startCase from 'lodash/startCase' // AKA: capitalize, titleCase
import { TupleSet, UnionOf } from './utils/typeGuardUtils';
import {initializeSetting} from './settingsCache'
import { getInstanceSettings } from './getInstanceSettings';
import { getCommandLineArguments } from '@/server/commandLine';

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
export class PublicInstanceSetting<SettingValueType> {
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

export const saplingApiKey = new PublicInstanceSetting<string>("sapling.apiKey", "", "optional");
export const forumHeaderTitleSetting = new PublicInstanceSetting<string>('forumSettings.headerTitle', "LESSWRONG", "warning");
export const forumShortTitleSetting = new PublicInstanceSetting<string>('forumSettings.shortForumTitle', "LW", "warning");
