import { runStartupFunctions } from '../lib/executionEnvironment';
import { filterConsoleLogSpam } from '../lib/consoleFilters';

let startupCalled = false;

async function clientStartup() {
  if (startupCalled) {
    return;
  }
  startupCalled = true;

  filterConsoleLogSpam();
  require('../client.js');
  await runStartupFunctions();
}

function startupAfterRendering() {
  // If for some reason the requestAnimationFrame functions don't fire (e.g. because
  // the tab is in the background), we still want to start the client reasonably quickly.
  setTimeout(() => clientStartup(), 500);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void clientStartup();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startupAfterRendering);
} else {
  void startupAfterRendering();
}
