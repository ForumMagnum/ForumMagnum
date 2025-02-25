import { datadogRum } from '@datadog/browser-rum';
import { getDatadogUser } from '../lib/collections/users/helpers';
import { isEAForum } from '../lib/instanceSettings';
import { ddRumSampleRate, ddSessionReplaySampleRate, ddTracingSampleRate } from '../lib/publicSettings';
import { getCookiePreferences } from '../lib/cookies/utils';
import { isE2E, isServer } from '../lib/executionEnvironment';

const hasDatadog = isEAForum && !isE2E;

let datadogInitialized = false;

export async function initDatadog() {
  const { cookiePreferences } = await getCookiePreferences();

  const analyticsCookiesAllowed = cookiePreferences.includes("analytics");

  if (isServer || !hasDatadog) return
  if (!analyticsCookiesAllowed) {
    // eslint-disable-next-line no-console
    console.log("Not initializing datadog because analytics cookies are not allowed")
    return
  }

  datadogRum.init({
    applicationId: '2e902643-baff-466d-8882-db60acbdf13b',
    clientToken: 'puba413e9fd2759b4b17c1909d396ba122a',
    site: 'datadoghq.com',
    service:'eaforum-client',
    env: ddEnv,
    version: '2.0.0',
    traceSampleRate: ddTracingSampleRate.get(),
    sessionSampleRate: ddRumSampleRate.get(),
    sessionReplaySampleRate: ddSessionReplaySampleRate.get(),
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel:'mask-user-input',
    startSessionReplayRecordingManually: true,
    allowedTracingUrls: [
      "http://localhost:3000",
      "https://forum.effectivealtruism.org",
      "https://forum-staging.effectivealtruism.org",
      "https://beta.effectivealtruism.org",
      // TODO add LW domains here if they want to use datadog
    ]
  });
  datadogInitialized = true;
}

export function configureDatadogRum(user: UsersCurrent | UsersEdit | DbUser | null) {
  if (!hasDatadog || !datadogInitialized) return

  // Set the user which will appear in traces
  datadogRum.setUser(user ? getDatadogUser(user) : {});

  if (user && !user.allowDatadogSessionReplay) {
    // eslint-disable-next-line no-console
    console.log("Session Replay disabled")
    datadogRum.stopSessionReplayRecording();
  } else {
    // eslint-disable-next-line no-console
    console.log("Session Replay enabled")
    datadogRum.startSessionReplayRecording();
  }
}

