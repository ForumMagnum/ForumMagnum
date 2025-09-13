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
import { getPrivateSettings } from './settings/settings';

const runValidateSettings = false

if (isDevelopment && runValidateSettings) {
  // On development we validate the settings files, but wait 30 seconds to make sure that everything has really been loaded
  setTimeout(() => validateSettings(registeredSettings, getPublicSettings(), getServerSettingsCache()), 30000)
}

/* 
  A setting which is stored in an environment variable with the private_ prefix.

  These settings are never sent to the client and so can be used for API secrets and other things that you never 
  want anyone but you to access.

  If you need a non-string value, use `ParsedServerSetting`.
    
  arguments: 
    settingName: JSON path to the setting in the settings.json file
    defaultValue: What value <Setting>.get() returns when no value is found in the env variable

  Method: 
    get: Returns the current value of the setting (either the value in the database or the default value)
*/
class ServerSetting<SettingValueType> {
  constructor(
    protected settingName: string, 
    protected defaultValue: SettingValueType,
  ) {
    initializeSetting(settingName, "server")
  }
  get(): SettingValueType | string {
    const privateSettings = getPrivateSettings();
    const value = get(privateSettings, this.settingName);
    if (typeof value === 'undefined') return this.defaultValue;
    return value;
  }
}

class ParsedServerSetting<SettingValueType> extends ServerSetting<SettingValueType> {
  constructor(
    settingName: string,
    defaultValue: SettingValueType,
  ) {
    super(settingName, defaultValue);
  }
  get(): SettingValueType {
    const value = super.get();
    if (typeof value === 'string') {
      const parsedValue = JSON.parse(value);
      const parsedValueType = typeof parsedValue;
      const defaultValueType = typeof this.defaultValue;
      if (parsedValueType !== defaultValueType) {
        throw new Error(`Setting ${this.settingName} has a value of type ${parsedValueType} but a default value of type ${defaultValueType}`);
      }
      return parsedValue;
    }
    return value;
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

export const openAIApiKey = new ServerSetting<string|null>('languageModels.openai.apiKey', null);
export const openAIOrganizationId = new ServerSetting<string|null>('languageModels.openai.organizationId', null);

export const tagBotAccountSlug = new ServerSetting<string|null>('languageModels.autoTagging.taggerAccountSlug', null);
export const tagBotActiveTimeSetting = new ServerSetting<"always" | "weekends">('languageModels.autoTagging.activeTime', "always");

export const autoFrontpageSetting = new ParsedServerSetting<boolean>('languageModels.autoTagging.autoFrontpage', false);
export const autoFrontpageModelSetting = new ServerSetting<string|null>('languageModels.autoTagging.autoFrontpageModel', "gpt-4o-mini");
export const autoFrontpagePromptSetting = new ServerSetting<string | null>("languageModels.autoTagging.autoFrontpagePrompt", null);

// Akismet API integration
export const akismetKeySetting = new ServerSetting<string | null>('akismet.apiKey', null)
export const akismetURLSetting = new ServerSetting<string | null>('akismet.url', null)

export const welcomeEmailPostId = new ServerSetting<string|null>("welcomeEmailPostId", null);
export const forumTeamUserId = new ServerSetting<string|null>("forumTeamUserId", null);

export const googleClientIdSetting = new ServerSetting<string | null>('oAuth.google.clientId', null);
export const googleOAuthSecretSetting = new ServerSetting<string | null>('oAuth.google.secret', null);

export const auth0ClientIdSetting = new ServerSetting<string | null>('oAuth.auth0.appId', null);
export const auth0OAuthSecretSetting = new ServerSetting<string | null>('oAuth.auth0.secret', null);
export const auth0DomainSetting = new ServerSetting<string | null>('oAuth.auth0.domain', null);

export const githubClientIdSetting = new ServerSetting<string | null>('oAuth.github.clientId', null);
export const githubOAuthSecretSetting = new ServerSetting<string | null>('oAuth.github.secret', null);
export const afGithubClientIdSetting = new ServerSetting<string | null>('oAuth.afGithub.clientId', null);
export const afGithubOAuthSecretSetting = new ServerSetting<string | null>('oAuth.afGithub.secret', null);

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

export const connectionStringSetting = new ServerSetting<string | null>("analytics.connectionString", null);
export const mirrorConnectionSettingString = new ServerSetting<string | null>("analytics.mirrorConnectionString", null); //for streaming to two DB at once

export const googleMapsApiKeySetting = new ServerSetting<string | null>('googleMaps.serverApiKey', null)

// robotsTxt: Optional setting to entirely replace the contents of robots.txt,
// to allow quickly banning a bad crawler or a slow endpoint without a redeploy,
// if quick response is needed. If null (the default), robots.txt is generated
// from other settings and the function below instead.
//
// (If you use this setting, remember to convert the robots.txt update into a
// PR to this file, and then set the setting back to null when it's merged,
// since the setting will override any future robots.txt updates.)
export const robotsTxtSetting = new ServerSetting<string|null>('robotsTxt', null)

export const awsRegionSetting = new ServerSetting<string>('swrCaching.awsRegion', 'us-east-1');
export const awsAccessKeyIdSetting = new ServerSetting<string | null>('swrCaching.accessKeyId', null);
export const awsSecretAccessKeySetting = new ServerSetting<string | null>('swrCaching.secretAccessKey', null);
export const cloudFrontDistributionIdSetting = new ServerSetting<string | null>('swrCaching.distributionId', null);

export const mailchimpAPIKeySetting = new ServerSetting<string | null>('mailchimp.apiKey', null)
export const lightconeFundraiserStripeSecretKeySetting = new ServerSetting<string | null>('stripe.lightconeFundraiserSecretKey', null)

export const googleDocImportClientIdSetting = new ServerSetting<string | null>('googleDocImport.oAuth.clientId', null)
export const googleDocImportClientSecretSetting = new ServerSetting<string | null>('googleDocImport.oAuth.secret', null)

/* Currently unused
const type3ClientIdSetting = new DatabaseServerSetting<string | null>('type3.clientId', null)
const type3WebhookSecretSetting = new DatabaseServerSetting<string | null>('type3.webhookSecret', null)
*/
export const type3ApiTokenSetting = new ServerSetting<string | null>("type3.apiToken", null);
export const type3SourceUrlSetting = new ServerSetting<string>("type3.sourceUrl", "");

export const elicitAPIKey = new ServerSetting('elicitAPIKey', null)

export const mailUrlSetting = new ServerSetting<string | null>('mailUrl', null) // The SMTP URL used to send out email

export const facebookClientIdSetting = new ServerSetting<string | null>('oAuth.facebook.appId', null)
export const facebookOAuthSecretSetting = new ServerSetting<string | null>('oAuth.facebook.secret', null)

export const expressSessionSecretSetting = new ServerSetting<string | null>('expressSessionSecret', null)

export const reCaptchaSecretSetting = new ServerSetting<string | null>('reCaptcha.secret', null) // ReCaptcha Secret

export const defaultEmailSetting = new ServerSetting<string>('defaultEmail', "hello@world.com")

export const gatherTownRoomPassword = new ServerSetting<string | null>("gatherTownRoomPassword", "the12thvirtue")

export const cloudinaryApiKey = new ServerSetting<string>("cloudinaryApiKey", "");
export const cloudinaryApiSecret = new ServerSetting<string>("cloudinaryApiSecret", "");

// Found in CkEditor Dashboard -- https://dashboard.ckeditor.com/
export const ckEditorEnvironmentIdSetting = new ServerSetting<string | null>('ckEditor.environmentId', null)

// Found in CkEditor Dashboard>Environment>Access credentials>Create new access key
export const ckEditorSecretKeySetting = new ServerSetting<string | null>('ckEditor.secretKey', null)

// Found in CkEditor Dashboard>Environment>API Configuration>API base URL
export const ckEditorApiPrefixSetting = new ServerSetting<string | null>('ckEditor.apiPrefix', null)

// Found in CkEditor Dashboard>Environment>Access credentials>Create new access key
export const ckEditorApiSecretKeySetting = new ServerSetting<string | null>('ckEditor.apiSecretKey', null)

export const healthCheckUserAgentSetting = new ServerSetting<string>("healthCheckUserAgent", "ELB-HealthChecker/2.0");

export const zohoClientId = new ServerSetting('zoho.clientId', '')
export const zohoClientSecret = new ServerSetting('zoho.secret', '')
export const zohoRefreshToken = new ServerSetting('zoho.refreshToken', '')

export const apolloEngineSettings = new ServerSetting<string | null>('apolloEngine.apiKey', null)

// Initiate Intercom on the server
export const intercomTokenSetting = new ServerSetting<string | null>("intercomToken", null)

export const crosspostSigningKeySetting = new ServerSetting<string|null>("fmCrosspostSigningKey", null);

interface SSLSettings {
  require?: boolean
  allowUnauthorized?: boolean
  ca?: string
}

export const sslSetting = new ParsedServerSetting<SSLSettings | null>(
  "analytics.ssl",
  null,
);

export const commentAncestorsToNotifySetting = new ParsedServerSetting<number>('commentAncestorsToNotifySetting', 1);

export const changesAllowedSetting = new ParsedServerSetting<number>('displayNameRateLimit.changesAllowed', 1);
export const sinceDaysAgoSetting = new ParsedServerSetting<number>('displayNameRateLimit.sinceDaysAgo', 60);

// Anti-DDoS measure
export const botProtectionCommentRedirectSetting = new ParsedServerSetting<boolean>("botProtectionCommentRedirect", false);

const gigabytes = 1024*1024*1024;
export const consoleLogMemoryUsageThreshold = new ParsedServerSetting<number>("consoleLogMemoryUsage", 1.5*gigabytes);
export const sentryErrorMemoryUsageThreshold = new ParsedServerSetting<number>("sentryErrorMemoryUsage", 2.1*gigabytes);
export const memoryUsageCheckInterval = new ParsedServerSetting<number>("memoryUsageCheckInterval", 10000);

export const logGraphqlQueriesSetting = new ParsedServerSetting<boolean>("logGraphqlQueries", false);
export const logGraphqlMutationsSetting = new ParsedServerSetting<boolean>("logGraphqlMutations", false);

export const swrCachingEnabledSetting = new ParsedServerSetting<boolean>('swrCaching.enabled', false)
export const swrCachingInvalidationIntervalMsSetting = new ParsedServerSetting<number>('swrCaching.invalidationIntervalMs', 30_000)

export const enableDevelopmentEmailsSetting = new ParsedServerSetting<boolean>('enableDevelopmentEmails', false)

// Minimum version number of the GatherTown bot that should run. If this is higher
// than the bot version in this file, then the cronjob shuts off so some other
// server can update it instead.
export const minGatherTownTrackerVersion = new ParsedServerSetting<number>("gatherTownTrackerVersion", 7);

export const petrovFalseAlarmMissileCount = new ParsedServerSetting<number[]>('petrovFalseAlarmMissileCount', [])
export const petrovRealAttackMissileCount = new ParsedServerSetting<number[]>('petrovRealAttackMissileCount', [])

/**
 * Timeout for cross-site requests to prevent crosspost requests from hanging
 * the site
 */
export const fmCrosspostTimeoutMsSetting = new ParsedServerSetting<number>('fmCrosspostTimeoutMs', 15000)

type Auth0Settings = {
  appId: string;
  secret: string;
  domain: string;
  originalDomain: string;
}

export const auth0SettingsDatabaseServerSetting = new ParsedServerSetting<Auth0Settings|null>("oAuth.auth0", null);

export const slowSSRWarnThresholdSetting = new ParsedServerSetting<number>("slowSSRWarnThreshold", 3000);

export const dbPageCacheEnabledSetting = new ParsedServerSetting<boolean>("dbPageCacheEnabled", true);

