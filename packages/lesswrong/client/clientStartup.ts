import { datadogRum } from '@datadog/browser-rum';
import { runStartupFunctions } from '../lib/executionEnvironment';

datadogRum.init({
  applicationId: '2e902643-baff-466d-8882-db60acbdf13b',
  clientToken: 'puba413e9fd2759b4b17c1909d396ba122a',
  site: 'datadoghq.com',
  service:'eaforum-client',
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

// console.log("Starting session replay recording")
// datadogRum.startSessionReplayRecording();

async function clientStartup() {
  require('../client.js');
  await runStartupFunctions();
}

void clientStartup();
