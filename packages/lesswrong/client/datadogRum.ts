import { datadogRum } from '@datadog/browser-rum';
import { getUserEmail } from '../lib/collections/users/helpers';

datadogRum.init({
  applicationId: '2e902643-baff-466d-8882-db60acbdf13b',
  clientToken: 'puba413e9fd2759b4b17c1909d396ba122a',
  site: 'datadoghq.com',
  service:'eaforum-client',
  env: ddEnv,
  // version: '1.0.0',
  sampleRate: 100,
  sessionReplaySampleRate: 100,
  trackInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel:'mask-user-input',
  allowedTracingOrigins: [
    "http://localhost:3000",
    "https://forum.effectivealtruism.org",
    "https://forum-staging.effectivealtruism.org"
    // TODO add LW domains here if they want to use datadog
  ]
});

export function configureDatadogRum(user: UsersCurrent | UsersEdit | DbUser | null) {
  // Set the user which will appear in traces
  datadogRum.setUser(user ? {
    id: user._id,
    email: getUserEmail(user),
    name: user.slug,
  } : {});

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

export default datadogRum;
