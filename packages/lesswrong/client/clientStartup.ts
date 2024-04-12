import { runStartupFunctions } from '../lib/executionEnvironment';
import { filterConsoleLogSpam } from '../lib/consoleFilters';
import { populateComponentsAppDebug } from '../lib/vulcan-lib';
import './publicSettings';
import '../lib';

async function clientStartup() {
  filterConsoleLogSpam();
  require('../client.js');
  await runStartupFunctions();
}

console.log(`clientStartup.ts, ${new Date().getTime()}`);
populateComponentsAppDebug();

function startupAfterRendering() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void clientStartup();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", (event) => {
    startupAfterRendering();
  });
} else {
  startupAfterRendering();
}
