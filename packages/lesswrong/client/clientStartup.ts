import { runStartupFunctions } from '../lib/executionEnvironment';

async function clientStartup() {
  require('../client.js');
  runStartupFunctions();
}

void clientStartup();
