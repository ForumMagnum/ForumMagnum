import { runStartupFunctions } from '../lib/executionEnvironment';
import { filterConsoleLogSpam } from '../lib/consoleFilters';

async function clientStartup() {
  filterConsoleLogSpam();
  require('../client.js');
  await runStartupFunctions();
}

void clientStartup();
