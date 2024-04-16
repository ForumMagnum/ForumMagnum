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

  console.log('startupAfterRendering entered', performance.now());
  requestAnimationFrame(() => {
    console.log('first requestAnimationFrame entered', performance.now());
    requestAnimationFrame(() => {
      console.log('second requestAnimationFrame entered', performance.now());
      void clientStartup();
    });
  });
}

if (document.readyState === 'loading') {
  console.log('document.readyState === loading', performance.now());
  document.addEventListener('DOMContentLoaded', startupAfterRendering);
} else {
  console.log('document.readyState !== loading', performance.now());
  void startupAfterRendering();
}

