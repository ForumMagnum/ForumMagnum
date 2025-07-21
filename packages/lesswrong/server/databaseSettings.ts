import { isDevelopment } from '../lib/executionEnvironment';
import {
    getPublicSettings,
    getServerSettingsCache,
    getServerSettingsLoaded,
    initializeSetting,
    registeredSettings,
} from '../lib/settingsCache'
import groupBy from 'lodash/groupBy';
import get from 'lodash/get'
import { forumSelect } from '@/lib/forumTypeUtils';

const runValidateSettings = false

if (isDevelopment && runValidateSettings) {
  // On development we validate the settings files, but wait 30 seconds to make sure that everything has really been loaded
  setTimeout(() => validateSettings(registeredSettings, getPublicSettings(), getServerSettingsCache()), 30000)
}

/* 
  A setting which is stored in the database in the "databasemetadata" collection, with the key "serverSettings"

  These settings are never sent to the client and so can be used for API secrets and other things that you never 
  want anyone but you to access.

  For documentation on public database settings, which are made available to the client (and so are not secret) see `publicSettings.ts`
  
  For documentation on public instance settings, which are also sent to the client but can be customized per instance, see `instanceSettings.ts`
  
  arguments: 
    settingName: JSON path to the setting in the settings.json file
    defaultValue: What value <Setting>.get() returns when no value is found in the JSON file

  Method: 
    get: Returns the current value of the setting (either the value in the database or the default value)
*/
export class DatabaseServerSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType
  ) {
    initializeSetting(settingName, "server")
  }
  get(): SettingValueType {
    if (!getServerSettingsLoaded())
      throw new Error(`Requested database setting ${this.settingName} before settings loaded`);
    // eslint-disable-next-line no-console
    const cacheValue = get(getServerSettingsCache(), this.settingName)
    if (typeof cacheValue === 'undefined') return this.defaultValue
    return cacheValue
  }
}

function validateSettings(registeredSettings: Record<string, "server" | "public" | "instance">, publicSettings: Record<string, any>, serverSettings: Record<string, any>) {
  Object.entries(registeredSettings).forEach(([key, value]) => {
    if (value === "server" && typeof get(serverSettings, key) === "undefined") {
      // eslint-disable-next-line no-console
      console.log(`Unable to find server database setting ${key} in serverSetting database object despite it being registered as a setting`)
    } else if (value === "public" && typeof get(publicSettings, key) === "undefined") {
      // eslint-disable-next-line no-console
      console.log(`Unable to find public database setting ${key} in publicSetting database object despite it being registered as a setting`)
    } 
  })
  Object.entries(serverSettings).forEach(([key, value]) => {
    if(typeof value === "object") {
      Object.keys(value).forEach(innerKey => {
        if (typeof registeredSettings[`${key}.${innerKey}`] === "undefined") {
          // eslint-disable-next-line no-console
          console.log(`Spurious setting provided in the server settings cache despite it not being registered: ${`${key}.${innerKey}`}`)
        }
      })
    } else if (typeof registeredSettings[key] === "undefined") {
      // eslint-disable-next-line no-console
      console.log(`Spurious setting provided in the server settings cache despite it not being registered: ${key}`)
    }
  })
  Object.entries(publicSettings).forEach(([key, value]) => {
    if (typeof value === "object") {
      Object.keys(value).forEach(innerKey => {
        if (typeof registeredSettings[`${key}.${innerKey}`] === "undefined") {
          // eslint-disable-next-line no-console
          console.log(`Spurious setting provided in the public settings cache despite it not being registered: ${`${key}.${innerKey}`}`)
        }
      })
    } else if (typeof registeredSettings[key] === "undefined") {
      // eslint-disable-next-line no-console
      console.log(`Spurious setting provided in the public settings cache despite it not being registered: ${key}`)
    }
  })
  // eslint-disable-next-line no-console
  console.log(groupBy(Object.keys(registeredSettings), key => registeredSettings[key]))
}

export const openAIApiKey = new DatabaseServerSetting<string|null>('languageModels.openai.apiKey', null);
export const openAIOrganizationId = new DatabaseServerSetting<string|null>('languageModels.openai.organizationId', null);

export const vertexDocumentServiceParentPathSetting = new DatabaseServerSetting<string | null>('googleVertex.documentServiceParentPath', null);
export const vertexUserEventServiceParentPathSetting = new DatabaseServerSetting<string | null>('googleVertex.userEventServiceParentPath', null);
export const vertexRecommendationServingConfigPathSetting = new DatabaseServerSetting<string | null>('googleVertex.recommendationServingConfigPath', null);

export const tagBotAccountSlug = new DatabaseServerSetting<string|null>('languageModels.autoTagging.taggerAccountSlug', null);
export const tagBotActiveTimeSetting = new DatabaseServerSetting<"always" | "weekends">('languageModels.autoTagging.activeTime', "always");

export const autoFrontpageSetting = new DatabaseServerSetting<boolean>('languageModels.autoTagging.autoFrontpage', false);
export const autoFrontpageModelSetting = new DatabaseServerSetting<string|null>('languageModels.autoTagging.autoFrontpageModel', "gpt-4o-mini");
export const autoFrontpagePromptSetting = new DatabaseServerSetting<string | null>("languageModels.autoTagging.autoFrontpagePrompt", null);

// Akismet API integration
export const akismetKeySetting = new DatabaseServerSetting<string | null>('akismet.apiKey', null)
export const akismetURLSetting = new DatabaseServerSetting<string | null>('akismet.url', null)

export const commentAncestorsToNotifySetting = new DatabaseServerSetting<number>('commentAncestorsToNotifySetting', forumSelect({EAForum: 5, default: 1}));

export const changesAllowedSetting = new DatabaseServerSetting<number>('displayNameRateLimit.changesAllowed', 1);
export const sinceDaysAgoSetting = new DatabaseServerSetting<number>('displayNameRateLimit.sinceDaysAgo', 60);

export const welcomeEmailPostId = new DatabaseServerSetting<string|null>("welcomeEmailPostId", null);
export const forumTeamUserId = new DatabaseServerSetting<string|null>("forumTeamUserId", null);

// Anti-DDoS measure
export const botProtectionCommentRedirectSetting = new DatabaseServerSetting<boolean>("botProtectionCommentRedirect", forumSelect({EAForum: true, default: false}));

export const googleClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.google.clientId', null);
export const googleOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.google.secret', null);

export const auth0ClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.appId', null);
export const auth0OAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.secret', null);
export const auth0DomainSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.domain', null);

export const githubClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.github.clientId', null);
export const githubOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.github.secret', null);
export const afGithubClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.afGithub.clientId', null);
export const afGithubOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.afGithub.secret', null);

export const hasAuth0 = () => {
  const { auth0ClientId, auth0OAuthSecret, auth0Domain } = getAuth0Credentials();

  return !!(auth0ClientId && auth0OAuthSecret && auth0Domain);
};

export const getAuth0Credentials = () => {
  const auth0ClientId = auth0ClientIdSetting.get();
  const auth0OAuthSecret = auth0OAuthSecretSetting.get();
  const auth0Domain = auth0DomainSetting.get();

  return {
    auth0ClientId,
    auth0OAuthSecret,
    auth0Domain,
  };
};

export const connectionStringSetting = new DatabaseServerSetting<string | null>("analytics.connectionString", null);
export const mirrorConnectionSettingString = new DatabaseServerSetting<string | null>("analytics.mirrorConnectionString", null); //for streaming to two DB at once

export const googleMapsApiKeySetting = new DatabaseServerSetting<string | null>('googleMaps.serverApiKey', null)

interface SSLSettings {
  require?: boolean
  allowUnauthorized?: boolean
  ca?: string
}

export const sslSetting = new DatabaseServerSetting<SSLSettings | null>(
  "analytics.ssl",
  forumSelect({
    EAForum: {
      require: true,
      allowUnauthorized: false,
    },
    default: null,
  })
);

// robotsTxt: Optional setting to entirely replace the contents of robots.txt,
// to allow quickly banning a bad crawler or a slow endpoint without a redeploy,
// if quick response is needed. If null (the default), robots.txt is generated
// from other settings and the function below instead.
//
// (If you use this setting, remember to convert the robots.txt update into a
// PR to this file, and then set the setting back to null when it's merged,
// since the setting will override any future robots.txt updates.)
export const robotsTxtSetting = new DatabaseServerSetting<string|null>('robotsTxt', null)

const gigabytes = 1024*1024*1024;
export const consoleLogMemoryUsageThreshold = new DatabaseServerSetting<number>("consoleLogMemoryUsage", 1.5*gigabytes);
export const sentryErrorMemoryUsageThreshold = new DatabaseServerSetting<number>("sentryErrorMemoryUsage", 2.1*gigabytes);
export const memoryUsageCheckInterval = new DatabaseServerSetting<number>("memoryUsageCheckInterval", 10000);

export const logGraphqlQueriesSetting = new DatabaseServerSetting<boolean>("logGraphqlQueries", false);
export const logGraphqlMutationsSetting = new DatabaseServerSetting<boolean>("logGraphqlMutations", false);

export const swrCachingEnabledSetting = new DatabaseServerSetting<boolean>('swrCaching.enabled', false)
export const swrCachingInvalidationIntervalMsSetting = new DatabaseServerSetting<number>('swrCaching.invalidationIntervalMs', 30_000)

export const awsRegionSetting = new DatabaseServerSetting<string>('swrCaching.awsRegion', 'us-east-1');
export const awsAccessKeyIdSetting = new DatabaseServerSetting<string | null>('swrCaching.accessKeyId', null);
export const awsSecretAccessKeySetting = new DatabaseServerSetting<string | null>('swrCaching.secretAccessKey', null);
export const cloudFrontDistributionIdSetting = new DatabaseServerSetting<string | null>('swrCaching.distributionId', null);

export const mailchimpAPIKeySetting = new DatabaseServerSetting<string | null>('mailchimp.apiKey', null)
export const lightconeFundraiserStripeSecretKeySetting = new DatabaseServerSetting<string | null>('stripe.lightconeFundraiserSecretKey', null)

export const googleDocImportClientIdSetting = new DatabaseServerSetting<string | null>('googleDocImport.oAuth.clientId', null)
export const googleDocImportClientSecretSetting = new DatabaseServerSetting<string | null>('googleDocImport.oAuth.secret', null)

/* Currently unused
const type3ClientIdSetting = new DatabaseServerSetting<string | null>('type3.clientId', null)
const type3WebhookSecretSetting = new DatabaseServerSetting<string | null>('type3.webhookSecret', null)
*/
export const type3ApiTokenSetting = new DatabaseServerSetting<string | null>("type3.apiToken", null);
export const type3SourceUrlSetting = new DatabaseServerSetting<string>("type3.sourceUrl", "");

export const elicitAPIKey = new DatabaseServerSetting('elicitAPIKey', null)

export const mailUrlSetting = new DatabaseServerSetting<string | null>('mailUrl', null) // The SMTP URL used to send out email

export const facebookClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.facebook.appId', null)
export const facebookOAuthSecretSetting = new DatabaseServerSetting<string | null>('oAuth.facebook.secret', null)

export const expressSessionSecretSetting = new DatabaseServerSetting<string | null>('expressSessionSecret', null)

export const reCaptchaSecretSetting = new DatabaseServerSetting<string | null>('reCaptcha.secret', null) // ReCaptcha Secret

export const defaultEmailSetting = new DatabaseServerSetting<string>('defaultEmail', "hello@world.com")

export const enableDevelopmentEmailsSetting = new DatabaseServerSetting<boolean>('enableDevelopmentEmails', false)

export const gatherTownRoomPassword = new DatabaseServerSetting<string | null>("gatherTownRoomPassword", "the12thvirtue")
// Minimum version number of the GatherTown bot that should run. If this is higher
// than the bot version in this file, then the cronjob shuts off so some other
// server can update it instead.
export const minGatherTownTrackerVersion = new DatabaseServerSetting<number>("gatherTownTrackerVersion", 7);

export const petrovFalseAlarmMissileCount = new DatabaseServerSetting<number[]>('petrovFalseAlarmMissileCount', [])
export const petrovRealAttackMissileCount = new DatabaseServerSetting<number[]>('petrovRealAttackMissileCount', [])

/**
 * Timeout for cross-site requests to prevent crosspost requests from hanging
 * the site
 */
export const fmCrosspostTimeoutMsSetting = new DatabaseServerSetting<number>('fmCrosspostTimeoutMs', 15000)

export const cloudinaryApiKey = new DatabaseServerSetting<string>("cloudinaryApiKey", "");
export const cloudinaryApiSecret = new DatabaseServerSetting<string>("cloudinaryApiSecret", "");

type Auth0Settings = {
  appId: string;
  secret: string;
  domain: string;
  originalDomain: string;
}

export const auth0SettingsDatabaseServerSetting = new DatabaseServerSetting<Auth0Settings|null>("oAuth.auth0", null);

export const dbPageCacheEnabledSetting = new DatabaseServerSetting<boolean>("dbPageCacheEnabled", true);

// Found in CkEditor Dashboard -- https://dashboard.ckeditor.com/
export const ckEditorEnvironmentIdSetting = new DatabaseServerSetting<string | null>('ckEditor.environmentId', null)

// Found in CkEditor Dashboard>Environment>Access credentials>Create new access key
export const ckEditorSecretKeySetting = new DatabaseServerSetting<string | null>('ckEditor.secretKey', null)

// Found in CkEditor Dashboard>Environment>API Configuration>API base URL
export const ckEditorApiPrefixSetting = new DatabaseServerSetting<string | null>('ckEditor.apiPrefix', null)

// Found in CkEditor Dashboard>Environment>Access credentials>Create new access key
export const ckEditorApiSecretKeySetting = new DatabaseServerSetting<string | null>('ckEditor.apiSecretKey', null)

export const healthCheckUserAgentSetting = new DatabaseServerSetting<string>("healthCheckUserAgent", "ELB-HealthChecker/2.0");

export const slowSSRWarnThresholdSetting = new DatabaseServerSetting<number>("slowSSRWarnThreshold", 3000);

export const disableServerSentEvents = new DatabaseServerSetting<boolean>("disableServerSentEvents", false);

export const zohoClientId = new DatabaseServerSetting('zoho.clientId', '')
export const zohoClientSecret = new DatabaseServerSetting('zoho.secret', '')
export const zohoRefreshToken = new DatabaseServerSetting('zoho.refreshToken', '')

export const apolloEngineSettings = new DatabaseServerSetting<string | null>('apolloEngine.apiKey', null)

// Initiate Intercom on the server
export const intercomTokenSetting = new DatabaseServerSetting<string | null>("intercomToken", null)

export const crosspostSigningKeySetting = new DatabaseServerSetting<string|null>("fmCrosspostSigningKey", null);

