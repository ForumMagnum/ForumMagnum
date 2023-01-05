import { runStartupFunctions } from '../lib/executionEnvironment';

async function clientStartup() {
  require('../client.js');
  await runStartupFunctions();
}

void clientStartup();
