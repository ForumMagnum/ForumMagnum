import { onStartupFunctions } from '../lib/executionEnvironment';

async function clientStartup() {
  console.log("In clientStartup");
  console.log((window as any).__APOLLO_STATE__);
  require('../../../client.js');
  for (let startupFunction of onStartupFunctions)
    await startupFunction();
}

clientStartup();
