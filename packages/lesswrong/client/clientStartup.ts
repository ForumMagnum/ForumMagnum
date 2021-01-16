import { onStartupFunctions } from '../lib/executionEnvironment';

async function clientStartup() {
  require('../client.js');
  for (let startupFunction of onStartupFunctions)
    await startupFunction();
}

void clientStartup();
