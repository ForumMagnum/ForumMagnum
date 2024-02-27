import { isServiceWorker, runStartupFunctions } from '../lib/executionEnvironment';
import { filterConsoleLogSpam } from '../lib/consoleFilters';

async function clientStartup() {
  filterConsoleLogSpam();
  
  if (isServiceWorker()) {
    console.log("clientStartup serviceWorker");
    require('./serviceWorker');
  } else {
    require('../client.js');
    await runStartupFunctions();
    const { browserMain } = require('./start');
    browserMain();
  }
}

void clientStartup();
